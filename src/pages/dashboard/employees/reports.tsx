// Employee Reports & Analytics Page
// Displays various HR reports including headcount, probation status, contracts expiring, etc.

import { useEffect, useState } from "react";
import { useAsgardeo } from "@asgardeo/react";
import {
 getHeadcountReport,
 getProbationStatus,
 getContractsExpiring,
 getUpcomingAnniversaries,
 getUpcomingBirthdays,
 getSalarySummary,
 formatSalary,
 canSeeSalary,
 type HeadcountReport,
 type ProbationStatusReport,
 type ContractsExpiringReport,
 type Anniversary,
 type Birthday,
 type SalarySummary,
} from "../../../lib/api/employees";

type ReportType =
 | "headcount"
 | "probation"
 | "contracts"
 | "anniversaries"
 | "birthdays"
 | "salary";

export default function EmployeeReports() {
 const { getAccessToken } = useAsgardeo();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [userRoles, setUserRoles] = useState<string[]>([]);
 const [activeReport, setActiveReport] = useState<ReportType>("headcount");

 // Report data
 const [headcountData, setHeadcountData] = useState<HeadcountReport | null>(
  null,
 );
 const [probationData, setProbationData] =
  useState<ProbationStatusReport | null>(null);
 const [contractsData, setContractsData] =
  useState<ContractsExpiringReport | null>(null);
 const [anniversariesData, setAnniversariesData] = useState<Anniversary[]>([]);
 const [birthdaysData, setBirthdaysData] = useState<Birthday[]>([]);
 const [salaryData, setSalaryData] = useState<SalarySummary | null>(null);

 useEffect(() => {
  extractUserRoles();
 }, []);

 useEffect(() => {
  if (userRoles.length > 0) {
   loadReport(activeReport);
  }
 }, [activeReport, userRoles]);

 async function extractUserRoles() {
  try {
   const token = await getAccessToken();
   const base64Url = token.split(".")[1];
   const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
   const payload = JSON.parse(window.atob(base64));
   const roles = payload.groups || [];
   setUserRoles(roles);
  } catch (err) {
   console.error("Failed to extract user roles:", err);
  }
 }

 async function loadReport(reportType: ReportType) {
  try {
   setLoading(true);
   setError(null);

   const token = await getAccessToken();

   switch (reportType) {
    case "headcount":
     const headcount = await getHeadcountReport(token);
     setHeadcountData(headcount);
     break;

    case "probation":
     const probation = await getProbationStatus(token);
     setProbationData(probation);
     break;

    case "contracts":
     const contracts = await getContractsExpiring(token, 30);
     setContractsData(contracts);
     break;

    case "anniversaries":
     const anniversaries = await getUpcomingAnniversaries(token, 30);
     setAnniversariesData(anniversaries);
     break;

    case "birthdays":
     const birthdays = await getUpcomingBirthdays(token, 30);
     setBirthdaysData(birthdays);
     break;

    case "salary":
     if (canSeeSalary(userRoles)) {
      const salary = await getSalarySummary(token);
      setSalaryData(salary);
     } else {
      setError("You don't have permission to view salary reports");
     }
     break;
   }
  } catch (err) {
   console.error("Failed to load report:", err);
   setError(err instanceof Error ? err.message : "Failed to load report");
  } finally {
   setLoading(false);
  }
 }

 const showSalaryReport = canSeeSalary(userRoles);

 const reportTabs: Array<{ id: ReportType; label: string; icon: string }> = [
  { id: "headcount", label: "Headcount", icon: "👥" },
  { id: "probation", label: "Probation Status", icon: "⏳" },
  { id: "contracts", label: "Contracts Expiring", icon: "📄" },
  { id: "anniversaries", label: "Anniversaries", icon: "🎉" },
  { id: "birthdays", label: "Birthdays", icon: "🎂" },
 ];

 if (showSalaryReport) {
  reportTabs.push({ id: "salary", label: "Salary Summary", icon: "💰" });
 }

 return (
  <div className="p-6 max-w-7xl mx-auto">
   {/* Header */}
   <div className="mb-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">
     Employee Reports & Analytics
    </h1>
    <p className="text-gray-600">
     Comprehensive HR reports and workforce analytics
    </p>
   </div>

   {/* Report Tabs */}
   <div className="bg-white rounded-lg shadow mb-6">
    <div className="border-b border-gray-200">
     <nav className="flex flex-wrap -mb-px">
      {reportTabs.map((tab) => (
       <button
        key={tab.id}
        onClick={() => setActiveReport(tab.id)}
        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
         activeReport === tab.id
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
       >
        <span className="mr-2">{tab.icon}</span>
        {tab.label}
       </button>
      ))}
     </nav>
    </div>
   </div>

   {/* Error State */}
   {error && (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
     <p className="text-red-800">{error}</p>
    </div>
   )}

   {/* Loading State */}
   {loading && (
    <div className="flex items-center justify-center py-12">
     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
   )}

   {/* Report Content */}
   {!loading && (
    <>
     {/* Headcount Report */}
     {activeReport === "headcount" && headcountData && (
      <div className="space-y-6">
       {/* Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
         <h3 className="text-sm font-medium text-gray-500 mb-2">
          Total Employees
         </h3>
         <p className="text-3xl font-bold text-gray-900">
          {headcountData.total_employees}
         </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
         <h3 className="text-sm font-medium text-gray-500 mb-2">
          Permanent
         </h3>
         <p className="text-3xl font-bold text-green-600">
          {headcountData.by_employment_type.permanent}
         </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
         <h3 className="text-sm font-medium text-gray-500 mb-2">
          Contract
         </h3>
         <p className="text-3xl font-bold text-yellow-600">
          {headcountData.by_employment_type.contract}
         </p>
        </div>
       </div>

       {/* By Department */}
       <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
         <h2 className="text-lg font-semibold text-gray-900">
          Headcount by Department
         </h2>
        </div>
        <div className="p-6">
         <div className="space-y-4">
          {headcountData.by_department.map((dept) => (
           <div
            key={dept.department}
            className="flex items-center justify-between"
           >
            <span className="text-gray-700 font-medium">
             {dept.department}
            </span>
            <div className="flex items-center gap-4">
             <div className="w-64 bg-gray-200 rounded-full h-2">
              <div
               className="bg-blue-600 h-2 rounded-full"
               style={{
                width: `${(dept.count / headcountData.total_employees) * 100}%`,
               }}
              ></div>
             </div>
             <span className="text-gray-900 font-semibold w-12 text-right">
              {dept.count}
             </span>
            </div>
           </div>
          ))}
         </div>
        </div>
       </div>

       {/* By Role */}
       <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
         <h2 className="text-lg font-semibold text-gray-900">
          Headcount by Role
         </h2>
        </div>
        <div className="p-6">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {headcountData.by_role.map((role) => (
           <div
            key={role.role}
            className="bg-gray-50 rounded-lg p-4 text-center"
           >
            <p className="text-sm text-gray-500 mb-1">
             {role.role}
            </p>
            <p className="text-2xl font-bold text-gray-900">
             {role.count}
            </p>
           </div>
          ))}
         </div>
        </div>
       </div>
      </div>
     )}

     {/* Probation Status Report */}
     {activeReport === "probation" && probationData && (
      <div className="bg-white rounded-lg shadow">
       <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
         <h2 className="text-lg font-semibold text-gray-900">
          Employees on Probation
         </h2>
         <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          {probationData.employees_on_probation} employees
         </span>
        </div>
       </div>
       <div className="p-6">
        {probationData.employees.length === 0 ? (
         <p className="text-gray-500 text-center py-8">
          No employees currently on probation
         </p>
        ) : (
         <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
           <thead>
            <tr>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Employee
             </th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Job Title
             </th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Department
             </th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Probation End Date
             </th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Days Remaining
             </th>
            </tr>
           </thead>
           <tbody className="divide-y divide-gray-200">
            {probationData.employees.map((emp) => (
             <tr key={emp.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
               <div className="text-sm font-medium text-gray-900">
                {emp.full_name}
               </div>
               <div className="text-sm text-gray-500">
                {emp.email}
               </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {emp.job_title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {emp.department}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {new Date(
                emp.probation_end_date,
               ).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
               <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                 emp.days_remaining <= 14
                  ? "bg-red-100 text-red-800"
                  : emp.days_remaining <= 30
                   ? "bg-yellow-100 text-yellow-800"
                   : "bg-green-100 text-green-800"
                }`}
               >
                {emp.days_remaining} days
               </span>
              </td>
             </tr>
            ))}
           </tbody>
          </table>
         </div>
        )}
       </div>
      </div>
     )}

     {/* Contracts Expiring Report */}
     {activeReport === "contracts" && contractsData && (
      <div className="bg-white rounded-lg shadow">
       <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
         <h2 className="text-lg font-semibold text-gray-900">
          Contracts Expiring Soon
         </h2>
         <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
          {contractsData.contracts_expiring} contracts
         </span>
        </div>
       </div>
       <div className="p-6">
        {contractsData.employees.length === 0 ? (
         <p className="text-gray-500 text-center py-8">
          No contracts expiring in the next 30 days
         </p>
        ) : (
         <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
           <thead>
            <tr>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Employee
             </th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Job Title
             </th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Department
             </th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Contract End Date
             </th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Days Remaining
             </th>
            </tr>
           </thead>
           <tbody className="divide-y divide-gray-200">
            {contractsData.employees.map((emp) => (
             <tr key={emp.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
               <div className="text-sm font-medium text-gray-900">
                {emp.full_name}
               </div>
               <div className="text-sm text-gray-500">
                {emp.email}
               </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {emp.job_title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {emp.department}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {new Date(
                emp.contract_end_date,
               ).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
               <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                 emp.days_remaining <= 7
                  ? "bg-red-100 text-red-800"
                  : emp.days_remaining <= 14
                   ? "bg-yellow-100 text-yellow-800"
                   : "bg-green-100 text-green-800"
                }`}
               >
                {emp.days_remaining} days
               </span>
              </td>
             </tr>
            ))}
           </tbody>
          </table>
         </div>
        )}
       </div>
      </div>
     )}

     {/* Anniversaries Report */}
     {activeReport === "anniversaries" && (
      <div className="bg-white rounded-lg shadow">
       <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
         Upcoming Work Anniversaries
        </h2>
        <p className="text-sm text-gray-500 mt-1">Next 30 days</p>
       </div>
       <div className="p-6">
        {anniversariesData.length === 0 ? (
         <p className="text-gray-500 text-center py-8">
          No anniversaries in the next 30 days
         </p>
        ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {anniversariesData.map((emp) => (
           <div
            key={emp.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300"
           >
            <div className="flex items-start justify-between">
             <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
               {emp.full_name}
              </h3>
              <p className="text-sm text-gray-500">
               {emp.job_title}
              </p>
              <p className="text-sm text-gray-500">
               {emp.department}
              </p>
             </div>
             <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
              {emp.years} {emp.years === 1 ? "year" : "years"}
             </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
             <p className="text-sm text-gray-600">
              Anniversary:{" "}
              {new Date(
               emp.anniversary_date,
              ).toLocaleDateString()}
             </p>
            </div>
           </div>
          ))}
         </div>
        )}
       </div>
      </div>
     )}

     {/* Birthdays Report */}
     {activeReport === "birthdays" && (
      <div className="bg-white rounded-lg shadow">
       <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
         Upcoming Birthdays
        </h2>
        <p className="text-sm text-gray-500 mt-1">Next 30 days</p>
       </div>
       <div className="p-6">
        {birthdaysData.length === 0 ? (
         <p className="text-gray-500 text-center py-8">
          No birthdays in the next 30 days
         </p>
        ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {birthdaysData.map((emp) => (
           <div
            key={emp.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-pink-300"
           >
            <div className="text-center">
             <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 text-white font-bold text-xl mb-3">
              {emp.full_name
               .split(" ")
               .map((n) => n[0])
               .join("")
               .toUpperCase()
               .slice(0, 2)}
             </div>
             <h3 className="font-semibold text-gray-900">
              {emp.full_name}
             </h3>
             <p className="text-sm text-gray-500">
              {emp.job_title}
             </p>
             <p className="text-sm text-gray-500">
              {emp.department}
             </p>
             <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
               🎂{" "}
               {new Date(emp.birthday_date).toLocaleDateString()}
              </p>
             </div>
            </div>
           </div>
          ))}
         </div>
        )}
       </div>
      </div>
     )}

     {/* Salary Summary Report */}
     {activeReport === "salary" && salaryData && (
      <div className="space-y-6">
       {/* Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
         <h3 className="text-sm font-medium text-gray-500 mb-2">
          Total Employees
         </h3>
         <p className="text-3xl font-bold text-gray-900">
          {salaryData.total_employees}
         </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
         <h3 className="text-sm font-medium text-gray-500 mb-2">
          Total Salary Expense
         </h3>
         <p className="text-3xl font-bold text-green-600">
          {formatSalary(salaryData.total_salary_expense)}
         </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
         <h3 className="text-sm font-medium text-gray-500 mb-2">
          Average Salary
         </h3>
         <p className="text-3xl font-bold text-blue-600">
          {formatSalary(salaryData.average_salary)}
         </p>
        </div>
       </div>

       {/* Salary Ranges */}
       <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
         <h2 className="text-lg font-semibold text-gray-900">
          Salary Distribution
         </h2>
        </div>
        <div className="p-6">
         <div className="space-y-4">
          {salaryData.salary_ranges.map((range) => (
           <div
            key={range.range}
            className="flex items-center justify-between"
           >
            <span className="text-gray-700 font-medium">
             {range.range}
            </span>
            <div className="flex items-center gap-4">
             <div className="w-64 bg-gray-200 rounded-full h-2">
              <div
               className="bg-green-600 h-2 rounded-full"
               style={{
                width: `${(range.count / salaryData.total_employees) * 100}%`,
               }}
              ></div>
             </div>
             <span className="text-gray-900 font-semibold w-12 text-right">
              {range.count}
             </span>
            </div>
           </div>
          ))}
         </div>
        </div>
       </div>
      </div>
     )}
    </>
   )}
  </div>
 );
}
