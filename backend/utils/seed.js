const bcrypt = require('bcryptjs');
const { sequelize, Role, User, Customer, Lead, Opportunity, FollowUp, Activity, AuditLog } = require('../models');

async function seedDatabase() {
  try {
    console.log('Connecting to database and synchronizing tables...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ force: false, alter: true });
    console.log('Database tables synchronized.');

    // 1. Seed Roles
    const rolesData = [
      { RoleId: 1, RoleName: 'Admin', Description: 'Full system, user, and CRM administration' },
      { RoleId: 2, RoleName: 'Manager', Description: 'Team CRM supervision, pipeline & management reports' },
      { RoleId: 3, RoleName: 'Sales Executive', Description: 'Assigned customer, lead, and pipeline management' }
    ];

    for (const r of rolesData) {
      await Role.findOrCreate({
        where: { RoleId: r.RoleId },
        defaults: r
      });
    }
    console.log('Roles seeded.');

    // 2. Seed Users
    const salt = await bcrypt.genSalt(10);
    const usersData = [
      {
        UserId: 1,
        Name: 'Alexander Vance',
        Email: 'admin@acxiomcrm.com',
        PasswordHash: await bcrypt.hash('Admin@123', salt),
        RoleId: 1,
        Department: 'Executive',
        Phone: '+91 9876543210',
        IsActive: true
      },
      {
        UserId: 2,
        Name: 'Sarah Jenkins',
        Email: 'manager@acxiomcrm.com',
        PasswordHash: await bcrypt.hash('Manager@123', salt),
        RoleId: 2,
        Department: 'Sales Leadership',
        Phone: '+91 9876543211',
        IsActive: true
      },
      {
        UserId: 3,
        Name: 'Marcus Sterling',
        Email: 'sales@acxiomcrm.com',
        PasswordHash: await bcrypt.hash('Sales@123', salt),
        RoleId: 3,
        Department: 'Direct Sales',
        Phone: '+91 9876543212',
        IsActive: true
      },
      {
        UserId: 4,
        Name: 'Elena Rostova',
        Email: 'elena.sales@acxiomcrm.com',
        PasswordHash: await bcrypt.hash('Sales@123', salt),
        RoleId: 3,
        Department: 'Direct Sales',
        Phone: '+91 9876543213',
        IsActive: true
      }
    ];

    for (const u of usersData) {
      const existing = await User.findOne({ where: { Email: u.Email } });
      if (!existing) {
        await User.create(u);
      }
    }
    console.log('Users seeded.');

    // 3. Seed Customers
    const customersCount = await Customer.count();
    if (customersCount === 0) {
      const customers = [
        {
          CustomerCode: 'CUST-1001',
          CustomerName: 'Apex Global Enterprises',
          Email: 'contact@apexglobal.com',
          Phone: '+91 9123456780',
          CompanyName: 'Apex Global Ltd',
          Address: 'Suite 400, Financial Tech Hub',
          City: 'Mumbai',
          State: 'Maharashtra',
          Status: 'Active',
          CreatedBy: 3,
          Notes: 'Enterprise financial client. Prefers quarterly check-ins.'
        },
        {
          CustomerCode: 'CUST-1002',
          CustomerName: 'Zenith Logistics Systems',
          Email: 'ops@zenithlogistics.in',
          Phone: '+91 9123456781',
          CompanyName: 'Zenith Systems',
          Address: 'Plot 12, Industrial Area Phase 2',
          City: 'Bengaluru',
          State: 'Karnataka',
          Status: 'Active',
          CreatedBy: 3,
          Notes: 'Interested in fleet tracking CRM integrations.'
        },
        {
          CustomerCode: 'CUST-1003',
          CustomerName: 'OmniHealth Solutions',
          Email: 'procurement@omnihealth.org',
          Phone: '+91 9123456782',
          CompanyName: 'OmniHealth Inc',
          Address: '88 Healthcare Boulevard',
          City: 'Hyderabad',
          State: 'Telangana',
          Status: 'Active',
          CreatedBy: 4,
          Notes: 'HIPAA compliant cloud deployment inquiry.'
        },
        {
          CustomerCode: 'CUST-1004',
          CustomerName: 'Nova Retail Ventures',
          Email: 'info@novaretail.com',
          Phone: '+91 9123456783',
          CompanyName: 'Nova Retail Group',
          Address: '104 Commerce Plaza',
          City: 'Delhi',
          State: 'Delhi',
          Status: 'Inactive',
          CreatedBy: 4,
          Notes: 'Project on hold due to restructuring.'
        }
      ];

      for (const c of customers) {
        await Customer.create(c);
      }
      console.log('Customers seeded.');
    }

    // 4. Seed Leads
    const leadsCount = await Lead.count();
    if (leadsCount === 0) {
      const leads = [
        {
          LeadCode: 'LEAD-1001',
          LeadName: 'Kavita Patel',
          Email: 'kavita@solarisdigital.com',
          Phone: '+91 9820011223',
          CompanyName: 'Solaris Digital Marketing',
          Source: 'Website',
          Status: 'Qualified',
          Priority: 'High',
          ExpectedValue: 185000.00,
          AssignedTo: 3,
          Notes: 'Submitted demo request from landing page. High intent.'
        },
        {
          LeadCode: 'LEAD-1002',
          LeadName: 'Amitava Sen',
          Email: 'amitava@easterntech.co',
          Phone: '+91 9830022334',
          CompanyName: 'Eastern Tech Solutions',
          Source: 'Referral',
          Status: 'Contacted',
          Priority: 'Medium',
          ExpectedValue: 95000.00,
          AssignedTo: 3,
          Notes: 'Follow-up email sent. Awaiting feedback from engineering head.'
        },
        {
          LeadCode: 'LEAD-1003',
          LeadName: 'David Chen',
          Email: 'dchen@pacifictrade.sg',
          Phone: '+91 9840033445',
          CompanyName: 'Pacific Trade Links',
          Source: 'Social Media',
          Status: 'New',
          Priority: 'Medium',
          ExpectedValue: 120000.00,
          AssignedTo: 4,
          Notes: 'Inquired about multi-currency sales management.'
        },
        {
          LeadCode: 'LEAD-1004',
          LeadName: 'Sanjay Kapoor',
          Email: 'sanjay@kapoorgroup.in',
          Phone: '+91 9850044556',
          CompanyName: 'Kapoor Manufacturing',
          Source: 'Campaign',
          Status: 'Lost',
          Priority: 'Low',
          ExpectedValue: 50000.00,
          AssignedTo: 4,
          Notes: 'Selected legacy on-premise competitor.'
        }
      ];

      for (const l of leads) {
        await Lead.create(l);
      }
      console.log('Leads seeded.');
    }

    // 5. Seed Opportunities
    const oppCount = await Opportunity.count();
    if (oppCount === 0) {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 30);
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 45);
      const futureDate3 = new Date();
      futureDate3.setDate(futureDate3.getDate() + 60);

      const opportunities = [
        {
          OpportunityName: 'Apex Enterprise CRM Rollout 500-Seats',
          CustomerId: 1,
          Amount: 450000.00,
          Stage: 'Negotiation',
          Probability: 75,
          ExpectedCloseDate: futureDate1.toISOString().split('T')[0],
          Status: 'Open',
          AssignedTo: 3,
          Notes: 'Contract redlines currently with legal department.'
        },
        {
          OpportunityName: 'Zenith Logistics Cloud Migration',
          CustomerId: 2,
          Amount: 220000.00,
          Stage: 'Proposal',
          Probability: 50,
          ExpectedCloseDate: futureDate2.toISOString().split('T')[0],
          Status: 'Open',
          AssignedTo: 3,
          Notes: 'Proposal presentation scheduled for next Thursday.'
        },
        {
          OpportunityName: 'OmniHealth Integration License',
          CustomerId: 3,
          Amount: 310000.00,
          Stage: 'Qualification',
          Probability: 25,
          ExpectedCloseDate: futureDate3.toISOString().split('T')[0],
          Status: 'Open',
          AssignedTo: 4,
          Notes: 'Technical architecture review phase.'
        },
        {
          OpportunityName: 'Apex Mobile CRM Add-on',
          CustomerId: 1,
          Amount: 85000.00,
          Stage: 'Won',
          Probability: 100,
          ExpectedCloseDate: new Date().toISOString().split('T')[0],
          Status: 'Won',
          AssignedTo: 3,
          Notes: 'Signed agreement received.'
        }
      ];

      for (const o of opportunities) {
        await Opportunity.create(o);
      }
      console.log('Opportunities seeded.');
    }

    // 6. Seed Follow-Ups
    const followUpsCount = await FollowUp.count();
    if (followUpsCount === 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const inTwoDays = new Date();
      inTwoDays.setDate(inTwoDays.getDate() + 2);
      inTwoDays.setHours(15, 30, 0, 0);

      const followUps = [
        {
          CustomerId: 1,
          LeadId: null,
          Subject: 'Review contract revision terms with Apex procurement',
          FollowUpDate: tomorrow,
          FollowUpType: 'Call',
          Remarks: 'Address questions regarding standard SLAs.',
          Status: 'Planned',
          AssignedTo: 3
        },
        {
          CustomerId: null,
          LeadId: 1,
          Subject: 'Product demo walkthrough with Kavita Patel',
          FollowUpDate: inTwoDays,
          FollowUpType: 'Meeting',
          Remarks: 'Prepare custom demo dataset.',
          Status: 'Planned',
          AssignedTo: 3
        }
      ];

      for (const f of followUps) {
        await FollowUp.create(f);
      }
      console.log('Follow-Ups seeded.');
    }

    // 7. Seed Activities
    const activityCount = await Activity.count();
    if (activityCount === 0) {
      const activities = [
        {
          ActivityType: 'Call',
          Subject: 'Introductory qualification discussion',
          Description: 'Discussed high-level requirements and user counts with buyer.',
          ActivityDate: new Date(),
          CustomerId: 1,
          AssignedTo: 3,
          Status: 'Completed'
        },
        {
          ActivityType: 'Email',
          Subject: 'Sent feature comparison matrix',
          Description: 'Sent full PDF comparison matrix vs Salesforce.',
          ActivityDate: new Date(),
          LeadId: 1,
          AssignedTo: 3,
          Status: 'Completed'
        }
      ];

      for (const a of activities) {
        await Activity.create(a);
      }
      console.log('Activities seeded.');
    }

    // 8. Seed Audit Log entries
    const auditCount = await AuditLog.count();
    if (auditCount === 0) {
      await AuditLog.create({
        UserId: 1,
        Action: 'SYSTEM_INITIALIZATION',
        EntityName: 'System',
        RecordId: '0',
        OldValue: null,
        NewValue: JSON.stringify({ message: 'AcxiomCRM Enterprise Database Initialized' }),
        IpAddress: '127.0.0.1',
        CreatedDate: new Date()
      });
      console.log('Audit log initialized.');
    }

    console.log('All seed operations completed successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = seedDatabase;
