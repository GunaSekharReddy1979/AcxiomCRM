const { Op, fn, col, literal } = require('sequelize');
const { Customer, Lead, Opportunity, FollowUp, Activity, User } = require('../models');

function getRoleScope(user) {
  if (user.roleName === 'Admin' || user.roleName === 'Manager') {
    return { isScoped: false, userId: null };
  }
  return { isScoped: true, userId: user.userId };
}

function getDateRangeFilter(dateFilter, fieldName = 'createdAt') {
  if (!dateFilter || dateFilter === 'all') return {};

  const now = new Date();
  let startDate = new Date();

  if (dateFilter === 'today') {
    startDate.setHours(0, 0, 0, 0);
    return { [fieldName]: { [Op.gte]: startDate } };
  }

  if (dateFilter === 'this_week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startDate = new Date(now.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    return { [fieldName]: { [Op.gte]: startDate } };
  }

  if (dateFilter === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    return { [fieldName]: { [Op.gte]: startDate } };
  }

  if (dateFilter === 'custom' && arguments[2] && arguments[3]) {
    const start = new Date(arguments[2]);
    const end = new Date(arguments[3]);
    end.setHours(23, 59, 59, 999);
    return { [fieldName]: { [Op.between]: [start, end] } };
  }

  return {};
}

async function getDashboardData(user, query = {}) {
  const { dateFilter = 'all', startDate, endDate } = query;
  const scope = getRoleScope(user);

  const customerWhere = {
    ...(scope.isScoped ? { CreatedBy: scope.userId } : {}),
    ...getDateRangeFilter(dateFilter, 'createdAt', startDate, endDate)
  };

  const leadWhere = {
    ...(scope.isScoped ? { AssignedTo: scope.userId } : {}),
    ...getDateRangeFilter(dateFilter, 'createdAt', startDate, endDate)
  };

  const oppWhere = {
    ...(scope.isScoped ? { AssignedTo: scope.userId } : {}),
    ...getDateRangeFilter(dateFilter, 'createdAt', startDate, endDate)
  };

  // 1. KPI Counts
  const totalCustomers = await Customer.count({ where: customerWhere });
  const totalLeads = await Lead.count({ where: leadWhere });
  const openLeads = await Lead.count({
    where: {
      ...leadWhere,
      Status: { [Op.notIn]: ['Converted', 'Lost', 'Unqualified'] }
    }
  });

  const totalOpportunities = await Opportunity.count({ where: oppWhere });
  const openOpportunities = await Opportunity.count({
    where: {
      ...oppWhere,
      Status: 'Open'
    }
  });
  const wonOpportunities = await Opportunity.count({
    where: {
      ...oppWhere,
      Status: 'Won'
    }
  });
  const lostOpportunities = await Opportunity.count({
    where: {
      ...oppWhere,
      Status: 'Lost'
    }
  });

  // Total Pipeline Value (Sum of Amount for Open opportunities)
  const openOpps = await Opportunity.findAll({
    where: {
      ...oppWhere,
      Status: 'Open'
    },
    attributes: ['Amount', 'Probability']
  });

  let totalPipelineValue = 0;
  let weightedPipelineValue = 0;
  openOpps.forEach(opp => {
    const amt = parseFloat(opp.Amount) || 0;
    const prob = parseInt(opp.Probability, 10) || 0;
    totalPipelineValue += amt;
    weightedPipelineValue += (amt * prob) / 100;
  });

  // 2. Chart 1: Lead Status Breakdown
  const leadStatuses = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'];
  const leadStatusCounts = {};
  for (const s of leadStatuses) {
    leadStatusCounts[s] = await Lead.count({
      where: {
        ...leadWhere,
        Status: s
      }
    });
  }

  // 3. Chart 2: Opportunity Pipeline Stage Breakdown
  const stages = ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const stageAmounts = {};
  const stageCounts = {};
  for (const st of stages) {
    const oppsInStage = await Opportunity.findAll({
      where: {
        ...oppWhere,
        Stage: st
      },
      attributes: ['Amount']
    });
    stageCounts[st] = oppsInStage.length;
    stageAmounts[st] = oppsInStage.reduce((acc, curr) => acc + (parseFloat(curr.Amount) || 0), 0);
  }

  // 4. Chart 3: Monthly Sales / Won Totals (last 6 months)
  const monthlyData = [];
  const currentMonthDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - i, 1);
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const monthLabel = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });

    const wonInMonth = await Opportunity.findAll({
      where: {
        ...(scope.isScoped ? { AssignedTo: scope.userId } : {}),
        Status: 'Won',
        updatedAt: { [Op.between]: [startOfMonth, endOfMonth] }
      },
      attributes: ['Amount']
    });

    const sumWon = wonInMonth.reduce((acc, curr) => acc + (parseFloat(curr.Amount) || 0), 0);
    monthlyData.push({ month: monthLabel, amount: sumWon, count: wonInMonth.length });
  }

  // 5. Upcoming Follow-Ups
  const now = new Date();
  const upcomingFollowUps = await FollowUp.findAll({
    where: {
      ...(scope.isScoped ? { AssignedTo: scope.userId } : {}),
      Status: 'Planned',
      FollowUpDate: { [Op.gte]: now }
    },
    include: [
      { model: Customer, as: 'customer', attributes: ['CustomerId', 'CustomerName'] },
      { model: Lead, as: 'lead', attributes: ['LeadId', 'LeadName'] },
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name'] }
    ],
    order: [['FollowUpDate', 'ASC']],
    limit: 5
  });

  // 6. Recent Activities
  const recentActivities = await Activity.findAll({
    where: scope.isScoped ? { AssignedTo: scope.userId } : {},
    include: [
      { model: Customer, as: 'customer', attributes: ['CustomerId', 'CustomerName'] },
      { model: Lead, as: 'lead', attributes: ['LeadId', 'LeadName'] },
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name'] }
    ],
    order: [['ActivityDate', 'DESC']],
    limit: 5
  });

  return {
    kpis: {
      totalCustomers,
      totalLeads,
      openLeads,
      totalOpportunities,
      openOpportunities,
      wonOpportunities,
      lostOpportunities,
      totalPipelineValue: Math.round(totalPipelineValue * 100) / 100,
      weightedPipelineValue: Math.round(weightedPipelineValue * 100) / 100
    },
    charts: {
      leadStatus: {
        labels: leadStatuses,
        data: leadStatuses.map(s => leadStatusCounts[s])
      },
      pipelineStage: {
        labels: stages,
        amounts: stages.map(st => stageAmounts[st]),
        counts: stages.map(st => stageCounts[st])
      },
      monthlySales: {
        labels: monthlyData.map(m => m.month),
        amounts: monthlyData.map(m => m.amount),
        counts: monthlyData.map(m => m.count)
      }
    },
    upcomingFollowUps,
    recentActivities
  };
}

module.exports = {
  getDashboardData
};
