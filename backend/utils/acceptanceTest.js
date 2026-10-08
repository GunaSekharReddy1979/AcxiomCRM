const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const fullUrl = `${BASE_URL}${url}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runAcceptanceTests() {
  console.log('=====================================================');
  console.log(' Starting AcxiomCRM Functional Acceptance Test Suite');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Unauthenticated request check
  const res1 = await req('/customers');
  assert(res1.status === 401, 'Scenario 1: Unauthenticated request to /api/customers rejected with 401 Unauthorized');

  // 2. Login with valid Admin credentials
  const res2 = await req('/auth/login', {
    method: 'POST',
    body: { email: 'admin@acxiomcrm.com', password: 'Admin@123' }
  });
  const adminToken = res2.data?.data?.token;
  assert(res2.status === 200 && adminToken, 'Scenario 2: Login with valid admin credentials succeeds with JWT token');

  // 3. Login with invalid credentials
  const res3 = await req('/auth/login', {
    method: 'POST',
    body: { email: 'admin@acxiomcrm.com', password: 'WrongPassword999!' }
  });
  assert(res3.status === 401, 'Scenario 3: Invalid password rejected with 401 Unauthorized');

  // 4. Repeated failed logins & Account Lockout
  const testEmail = `testlockout_${Date.now()}@acxiomcrm.com`;
  await req('/auth/register', {
    method: 'POST',
    body: { name: 'Lockout Tester', email: testEmail, password: 'Password@123', roleId: 3 }
  });

  let lockoutTriggered = false;
  for (let i = 1; i <= 6; i++) {
    const lockRes = await req('/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'BadPassword!123' }
    });
    if (lockRes.status === 403 && lockRes.data?.message?.includes('locked')) {
      lockoutTriggered = true;
      break;
    }
  }
  assert(lockoutTriggered, 'Scenario 4: Account lockout triggers after consecutive failed login attempts (403 Account Locked)');

  // 5 & 6. Server-side validation of Customer email and phone
  const res6 = await req('/customers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { customerName: 'Test Invalid Client', email: 'invalid-email-format', phone: '123' }
  });
  assert(res6.status === 400, 'Scenario 6: Server-side validation rejects invalid email with 400 Bad Request');

  // 7. Opportunity Amount <= 0 rejected
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const res7 = await req('/opportunities', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      opportunityName: 'Zero Value Deal',
      amount: 0,
      probability: 50,
      expectedCloseDate: futureDate.toISOString().split('T')[0]
    }
  });
  assert(
    res7.status === 400 && res7.data?.message?.includes('greater than 0'),
    'Scenario 7: Server rejects Opportunity Amount <= 0 with "Opportunity Amount must be greater than 0."'
  );

  // 8. Opportunity Probability > 100 rejected
  const res8 = await req('/opportunities', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      opportunityName: 'Over 100 Probability Deal',
      amount: 50000,
      probability: 105,
      expectedCloseDate: futureDate.toISOString().split('T')[0]
    }
  });
  assert(
    res8.status === 400 && res8.data?.message?.includes('between 0 and 100'),
    'Scenario 8: Server rejects Probability > 100 with "Probability must be between 0 and 100."'
  );

  // 9. Active Opportunity past close date rejected
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 10);
  const res9 = await req('/opportunities', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      opportunityName: 'Past Close Deal',
      amount: 50000,
      probability: 50,
      expectedCloseDate: pastDate.toISOString().split('T')[0]
    }
  });
  assert(
    res9.status === 400 && res9.data?.message?.includes('cannot be in the past'),
    'Scenario 9: Server rejects active opportunity with past close date ("Expected Close Date cannot be in the past.")'
  );

  // 10. Follow-up dated before today rejected
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);
  const res10 = await req('/followups', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      subject: 'Retroactive follow-up',
      followUpDate: yesterday.toISOString(),
      followUpType: 'Call',
      status: 'Planned'
    }
  });
  assert(
    res10.status === 400 && res10.data?.message?.includes('earlier than today'),
    'Scenario 10: Server rejects new follow-up with past date ("Follow-up date cannot be earlier than today.")'
  );

  // 11. Role Scoping: Sales Executive vs Admin
  const salesLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'sales@acxiomcrm.com', password: 'Sales@123' }
  });
  const salesToken = salesLogin.data?.data?.token;

  const salesAdminAccess = await req('/users', {
    headers: { Authorization: `Bearer ${salesToken}` }
  });
  assert(salesAdminAccess.status === 403, 'Scenario 11: Sales Executive blocked from /api/users with 403 Forbidden');

  const custRes = await req('/customers', {
    headers: { Authorization: `Bearer ${salesToken}` }
  });
  assert(custRes.status === 200, 'Scenario 11: Sales Executive receives scoped customer list');

  // 12. Manager access to Pipeline reports
  const mgrLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'manager@acxiomcrm.com', password: 'Manager@123' }
  });
  const mgrToken = mgrLogin.data?.data?.token;

  const reportRes = await req('/reports/pipeline', {
    headers: { Authorization: `Bearer ${mgrToken}` }
  });
  assert(reportRes.status === 200 && reportRes.data?.data?.stageSummary, 'Scenario 12: Manager accesses team pipeline reports successfully');

  // 13. Admin access to User Administration and Audit Logs
  const usersRes = await req('/users', { headers: { Authorization: `Bearer ${adminToken}` } });
  const auditRes = await req('/audit-logs', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(usersRes.status === 200 && auditRes.status === 200, 'Scenario 13: Admin accesses user administration and system audit logs');

  // 14. Audit entry verification after mutation
  const uniqueEmail = `audit_client_${Date.now()}@acme.com`;
  const uniquePhone = `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const custCreate = await req('/customers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      customerName: 'Audit Trail Test Corp',
      email: uniqueEmail,
      phone: uniquePhone,
      companyName: 'Acme Audit Holdings'
    }
  });
  const newCustId = custCreate.data?.data?.CustomerId;

  const auditCheck = await req('/audit-logs?module=Customer', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const foundLog = auditCheck.data?.data?.auditLogs?.find(l => l.RecordId == newCustId && l.Action === 'CREATE');
  assert(!!foundLog, 'Scenario 14: CRM Customer creation generated append-only AuditLog entry');

  // 15. Authorized /api/customers call
  const custCall = await req('/customers', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(custCall.status === 200 && Array.isArray(custCall.data?.data?.customers), 'Scenario 15: Authorized call to /api/customers returns valid JSON array');

  // 16. Dashboard KPIs and Charts verification
  const dashRes = await req('/dashboard', { headers: { Authorization: `Bearer ${adminToken}` } });
  const { kpis, charts } = dashRes.data?.data || {};
  const hasAllKpis =
    kpis?.totalCustomers !== undefined &&
    kpis?.totalLeads !== undefined &&
    kpis?.openLeads !== undefined &&
    kpis?.totalOpportunities !== undefined &&
    kpis?.openOpportunities !== undefined &&
    kpis?.wonOpportunities !== undefined &&
    kpis?.lostOpportunities !== undefined &&
    kpis?.totalPipelineValue !== undefined;

  const hasAllCharts =
    charts?.leadStatus?.labels?.length > 0 &&
    charts?.pipelineStage?.labels?.length > 0 &&
    charts?.monthlySales?.labels?.length > 0;

  assert(hasAllKpis && hasAllCharts, 'Scenario 16: Dashboard endpoint returns all 8 required KPI metrics and 3 Chart.js datasets');

  console.log('\n=====================================================');
  console.log(` Acceptance Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTests();
