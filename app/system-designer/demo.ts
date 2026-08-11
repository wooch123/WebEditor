import type { SystemBinding, SystemNode, SystemProject } from "./types";

const demoIds = new Map<string, string>();
let demoIdSequence = 1;
function demoId(key: string) {
  const existing = demoIds.get(key);
  if (existing) return existing;
  const value = `00000000-0000-4000-8000-${String(demoIdSequence++).padStart(12, "0")}`;
  demoIds.set(key, value);
  return value;
}

const node = (id: string, type: SystemNode["type"], name: string, x: number, y: number, metadata: Record<string, string> = {}, description = "", parentId?: string): SystemNode => ({
  id: demoId(`node:${id}`), type, name, x, y, metadata, description, ...(parentId ? { parentId: demoId(`node:${parentId}`) } : {}),
});

const binding = (id: string, sourceId: string, targetId: string, bindingType: string, operation: SystemBinding["operation"] = "-", label?: string): SystemBinding => ({
  id: demoId(`binding:${id}`), sourceId: demoId(`node:${sourceId}`), targetId: demoId(`node:${targetId}`), bindingType, operation, ...(label ? { label } : {}),
});

export function createDemoSystemProject(): SystemProject {
  const nodes: SystemNode[] = [
    node("page-dashboard", "page", "Dashboard", 70, 80, { route: "/dashboard", layoutPageId: "dashboard", roles: "ADMIN, MANAGER, USER", crud: "R" }, "조직의 핵심 지표와 최근 활동을 보여주는 시작 화면"),
    node("page-employees", "page", "Employee List", 70, 300, { route: "/employees", roles: "ADMIN, MANAGER", crud: "CRU" }, "직원 검색, 목록 조회, 등록 진입을 제공하는 업무 화면"),
    node("page-employee-detail", "page", "Employee Detail", 70, 520, { route: "/employees/:id", roles: "ADMIN, MANAGER", crud: "RU" }, "직원 상세 정보 조회 및 수정 화면", "page-employees"),
    node("page-departments", "page", "Department Management", 70, 740, { route: "/departments", roles: "ADMIN", crud: "CRUD" }, "부서 및 조직 구조 관리 화면"),

    node("component-kpi", "component", "KpiCards", 390, 60, { componentType: "Card", dataSource: "GET /api/dashboard", event: "LOAD", validation: "-" }, "대시보드 KPI 카드", "page-dashboard"),
    node("component-search", "component", "EmployeeSearchBox", 390, 255, { componentType: "SearchBox", dataSource: "GET /api/employees", event: "SEARCH", validation: "2자 이상" }, "이름과 사번 통합 검색", "page-employees"),
    node("component-filter", "component", "DepartmentFilter", 390, 385, { componentType: "Select", dataSource: "GET /api/departments", event: "CHANGE", validation: "-" }, "부서별 직원 필터", "page-employees"),
    node("component-table", "component", "EmployeeTable", 390, 520, { componentType: "Table", dataSource: "GET /api/employees", event: "SORT, PAGINATION", validation: "-" }, "직원 목록과 주요 정보를 표시", "page-employees"),
    node("component-form", "component", "EmployeeDetailForm", 390, 705, { componentType: "Form", dataSource: "GET /api/employees/:id", event: "SUBMIT", validation: "email, required" }, "직원 상세 조회 및 수정 폼", "page-employee-detail"),

    node("api-dashboard", "api", "GET /api/dashboard", 750, 60, { method: "GET", path: "/api/dashboard", request: "-", response: "employeeCount, activity[]", auth: "Bearer" }, "대시보드 집계 조회"),
    node("api-employees", "api", "GET /api/employees", 750, 245, { method: "GET", path: "/api/employees", request: "search, department, page, limit", response: "employees[], total, page, limit", auth: "Bearer" }, "직원 검색 및 페이지 조회"),
    node("api-employee-detail", "api", "GET /api/employees/:id", 750, 430, { method: "GET", path: "/api/employees/:id", request: "id", response: "employee", auth: "Bearer" }, "직원 상세 조회"),
    node("api-employee-update", "api", "PUT /api/employees/:id", 750, 615, { method: "PUT", path: "/api/employees/:id", request: "name, email, departmentId, roleId", response: "employee", auth: "Bearer" }, "직원 정보 수정"),
    node("api-departments", "api", "GET /api/departments", 750, 800, { method: "GET", path: "/api/departments", request: "page, limit", response: "departments[]", auth: "Bearer" }, "부서 목록 조회"),

    node("logic-dashboard", "logic", "DashboardService", 1110, 60, { input: "session.userId", process: "Aggregate KPI", condition: "active = true", output: "DashboardSummary" }, "대시보드 집계 비즈니스 로직"),
    node("logic-employee", "logic", "EmployeeService", 1110, 350, { input: "EmployeeQuery / EmployeeCommand", process: "Validate → Query → Map", condition: "role permission", output: "Employee DTO" }, "직원 조회와 수정 규칙"),
    node("logic-department", "logic", "DepartmentService", 1110, 720, { input: "DepartmentQuery", process: "Query active departments", condition: "status = ACTIVE", output: "Department DTO[]" }, "부서 조회 규칙"),

    node("table-employees", "table", "employees", 1470, 170, { schema: "public", primaryKey: "id", indexes: "email UNIQUE; department_id, created_at", relation: "departments 1:N, roles 1:N" }, "직원 마스터 테이블"),
    node("field-employee-id", "field", "employees.id", 1810, 70, { dataType: "bigint", key: "PK", nullable: "NO", index: "PRIMARY" }, "직원 식별자", "table-employees"),
    node("field-employee-name", "field", "employees.name", 1810, 180, { dataType: "varchar(100)", key: "", nullable: "NO", index: "" }, "직원 이름", "table-employees"),
    node("field-employee-email", "field", "employees.email", 1810, 290, { dataType: "varchar(200)", key: "", nullable: "NO", index: "UNIQUE" }, "로그인 및 연락 이메일", "table-employees"),
    node("field-employee-dept", "field", "employees.department_id", 1810, 400, { dataType: "bigint", key: "FK", nullable: "NO", index: "INDEX" }, "소속 부서 FK", "table-employees"),
    node("table-departments", "table", "departments", 1470, 560, { schema: "public", primaryKey: "id", indexes: "name UNIQUE", relation: "employees 1:N" }, "부서 마스터 테이블"),
    node("field-department-id", "field", "departments.id", 1810, 545, { dataType: "bigint", key: "PK", nullable: "NO", index: "PRIMARY" }, "부서 식별자", "table-departments"),
    node("field-department-name", "field", "departments.name", 1810, 655, { dataType: "varchar(120)", key: "", nullable: "NO", index: "UNIQUE" }, "부서명", "table-departments"),
    node("table-roles", "table", "roles", 1470, 790, { schema: "public", primaryKey: "id", indexes: "code UNIQUE", relation: "employees 1:N" }, "권한 역할 테이블"),

    node("role-admin", "role", "ADMIN", 390, 930, { pageAccess: "ALL", componentVisibility: "ALL", apiPermission: "CRUD", crud: "CRUD" }, "전체 관리 권한"),
    node("role-manager", "role", "MANAGER", 750, 930, { pageAccess: "Dashboard, Employee", componentVisibility: "Employee", apiPermission: "READ, UPDATE", crud: "RU" }, "직원 운영 권한"),
    node("storage-files", "storage", "Employee File Storage", 1110, 930, { storageType: "S3 Compatible", endpoint: "/api/files", metadataTable: "file_metadata", retention: "5 years" }, "직원 첨부파일 저장소"),
    node("external-mail", "external", "Email Service", 1470, 1030, { provider: "SMTP / API", purpose: "변경 알림", retry: "3" }, "직원 정보 변경 알림 서비스"),
  ];

  const bindings: SystemBinding[] = [
    binding("bind-page-flow-1", "page-dashboard", "page-employees", "NAVIGATION", "-", "직원 관리"),
    binding("bind-page-flow-2", "page-employees", "page-employee-detail", "NAVIGATION", "R", "행 선택"),
    binding("bind-page-flow-3", "page-dashboard", "page-departments", "NAVIGATION"),
    binding("bind-page-kpi", "page-dashboard", "component-kpi", "CONTAINS", "R"),
    binding("bind-page-search", "page-employees", "component-search", "CONTAINS", "R"),
    binding("bind-page-filter", "page-employees", "component-filter", "CONTAINS", "R"),
    binding("bind-page-table", "page-employees", "component-table", "CONTAINS", "R"),
    binding("bind-page-form", "page-employee-detail", "component-form", "CONTAINS", "RU" as SystemBinding["operation"]),
    binding("bind-kpi-api", "component-kpi", "api-dashboard", "API", "R", "LOAD"),
    binding("bind-search-api", "component-search", "api-employees", "API", "R", "SEARCH"),
    binding("bind-filter-api", "component-filter", "api-departments", "API", "R", "CHANGE"),
    binding("bind-table-api", "component-table", "api-employees", "API", "R", "LOAD / SORT / PAGE"),
    binding("bind-form-get", "component-form", "api-employee-detail", "API", "R", "LOAD"),
    binding("bind-form-put", "component-form", "api-employee-update", "API", "U", "SUBMIT"),
    binding("bind-api-dashboard-logic", "api-dashboard", "logic-dashboard", "CALLS", "R"),
    binding("bind-api-employees-logic", "api-employees", "logic-employee", "CALLS", "R"),
    binding("bind-api-detail-logic", "api-employee-detail", "logic-employee", "CALLS", "R"),
    binding("bind-api-update-logic", "api-employee-update", "logic-employee", "CALLS", "U"),
    binding("bind-api-department-logic", "api-departments", "logic-department", "CALLS", "R"),
    binding("bind-dashboard-employee", "logic-dashboard", "table-employees", "DATABASE", "R"),
    binding("bind-logic-employees", "logic-employee", "table-employees", "DATABASE", "R"),
    binding("bind-logic-employees-update", "logic-employee", "table-employees", "DATABASE", "U"),
    binding("bind-logic-departments", "logic-employee", "table-departments", "DATABASE", "R"),
    binding("bind-department-table", "logic-department", "table-departments", "DATABASE", "R"),
    binding("bind-employees-id", "table-employees", "field-employee-id", "FIELD", "R"),
    binding("bind-employees-name", "table-employees", "field-employee-name", "FIELD", "R"),
    binding("bind-employees-email", "table-employees", "field-employee-email", "FIELD", "R"),
    binding("bind-employees-dept", "table-employees", "field-employee-dept", "FIELD", "R"),
    binding("bind-departments-id", "table-departments", "field-department-id", "FIELD", "R"),
    binding("bind-departments-name", "table-departments", "field-department-name", "FIELD", "R"),
    binding("bind-fk-department", "field-employee-dept", "field-department-id", "FK 1:N", "R"),
    binding("bind-admin-page", "role-admin", "page-dashboard", "PERMISSION", "R"),
    binding("bind-admin-employees", "role-admin", "page-employees", "PERMISSION", "R"),
    binding("bind-manager-employees", "role-manager", "page-employees", "PERMISSION", "R"),
    binding("bind-manager-detail", "role-manager", "page-employee-detail", "PERMISSION", "U"),
    binding("bind-files-form", "component-form", "storage-files", "STORAGE", "U", "UPLOAD"),
    binding("bind-mail-update", "logic-employee", "external-mail", "EVENT", "U", "UPDATED"),
  ];

  return {
    version: 1,
    id: demoId("project:employee-management-system"),
    name: "Employee Management System",
    description: "페이지·컴포넌트·API·비즈니스 로직·DB·권한을 하나의 관계 모델로 추적하는 데모 프로젝트",
    updatedAt: Date.now(),
    nodes,
    bindings,
  };
}
