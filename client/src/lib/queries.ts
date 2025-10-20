import { gql } from "@apollo/client";

export const QUERY_SUBSCRIPTION = `
query ServiceSubscription($id: ID!) {
  serviceSubscription(id: $id) {
    id
    service_name
    vendor
    license_type
    pricing_type
    status
    category
    payment_method
    cancellation_date
    official_website
    official_support
    notes
    licenses {
      id
      service_subscription_id
      account_id
      unit_price
      currency
      billing_cycle
      billing_interval
      start_date
      end_date
      renewal_date
      version
      license_key
      used
      assigned_employee_id
      assigned_employee {
        employee_id
        name
        email
      }
    }
  }
}
`;

export const MUT_UPDATE_SUBSCRIPTION = `
mutation UpdateServiceSubscription($input: UpdateServiceSubscriptionInput!) {
  updateServiceSubscription(input: $input) {
    id
    service_name
    vendor
    notes
  }
}
`;

export const MUT_ASSIGN_LICENSE = `
mutation AssignLicense($input: AssignLicenseInput!) {
  assignLicenseToEmployee(input: $input) {
    id
    used
    assigned_employee_id
    assigned_employee { employee_id name email }
  }
}
`;

export const MUT_UNASSIGN_LICENSE = `
mutation UnassignLicense($licenseId: ID!) {
  unassignLicense(licenseId: $licenseId) {
    id
    used
    assigned_employee_id
  }
}
`;

export const MUT_DELETE_LICENSE = `
mutation DeleteLicense($id: ID!) {
  deleteLicense(id: $id)
}
`;

export const SEARCH_EMPLOYEES = gql`
query SearchEmployees($name: String!) {
  searchEmployees(name: $name) {
    employee_id
    name
    email
  }
}
`;

export const GET_SUBSCRIPTION = gql`
  query GetSubscription($id: ID!) {
    getSubscription(id: $id) {
      id
      service_name
      vendor
      license_type
      pricing_type
      status
      category
      payment_method
      cancellation_date
      official_website
      official_support
      notes
      per_seat_monthly_price
      per_seat_yearly_price
      per_seat_currency
      licenses {
        id
        account_id
        used
        unit_price
        currency
        billing_cycle
        billing_interval
        start_date
        end_date
        renewal_date
        version
        license_key
        assigned_employee {
          id
          employee_id
          name
          email
          location
        }
      }
      employees {
        employee_id
        name
        email
        location
        assigned_at
      }
    }
  }
`;

export const ASSIGN_EMPLOYEE_TO_LICENSE = gql`
mutation AssignEmployee(
  $subscriptionId: ID!
    $employeeId: String!
    $licenseId: ID
  ) {
    assignEmployeeToSubscription(
      subscription_id: $subscriptionId
      employee_id: $employeeId
      license_id: $licenseId
    ) {
      success
      message
    }
  }
`;

export const ASSIGN_EMPLOYEE_TO_SUB = gql`
  mutation AssignEmployeeToSub(
    $subscriptionId: ID!
    $employeeId: String!
  ) {
    assignEmployeeToSubscription(
      subscription_id: $subscriptionId
      employee_id: $employeeId
    ) {
      success
      message
    }
  }
`;

export const UNASSIGN_EMPLOYEE = gql`
  mutation UnassignEmployee(
    $subscriptionId: ID!
    $employeeId: String!
  ) {
    unassignEmployeeFromSubscription(
      subscription_id: $subscriptionId
      employee_id: $employeeId
    ) {
      success
      message
    }
  }
`;