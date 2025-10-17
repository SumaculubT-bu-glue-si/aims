<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ActivityLogMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only log for authenticated users and successful requests
        if (Auth::guard('api')->check() && $this->isSuccessfulResponse($response)) {
            $this->logActivity($request, $response);
        }

        return $response;
    }

    /**
     * Check if the response is successful.
     */
    private function isSuccessfulResponse($response): bool
    {
        try {
            // For GraphQL responses, check if it's a valid response object
            if (method_exists($response, 'getStatusCode')) {
                return $response->getStatusCode() < 400;
            }

            // For other responses, assume successful if no exception was thrown
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Log the user activity.
     */
    private function logActivity(Request $request, $response)
    {
        try {
            $user = Auth::guard('api')->user();
            if (!$user) return;

            // Skip logging for GraphQL introspection queries
            if ($this->isIntrospectionQuery($request)) {
                return;
            }

            // Only log CRUD operations (Create, Read, Update, Delete)
            if (!$this->isCrudOperation($request)) {
                return;
            }

            $action = $this->determineAction($request);
            $description = $this->generateDescription($request, $action);

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'description' => $description,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'metadata' => $this->getMetadata($request, $response),
            ]);
        } catch (\Exception $e) {
            // Don't let activity logging break the main request
            Log::warning('Activity logging failed: ' . $e->getMessage());
        }
    }

    /**
     * Determine the action based on the request.
     */
    private function determineAction(Request $request): string
    {
        $method = $request->method();
        $path = $request->path();

        // GraphQL mutations
        if (str_contains($path, 'graphql')) {
            $body = $request->input();
            if (isset($body['query'])) {
                $query = $body['query'];

                // Extract mutation name
                if (preg_match('/mutation\s+(\w+)/', $query, $matches)) {
                    $mutationName = $matches[1];

                    // Map mutation names to user-friendly actions
                    $actionMap = [
                        'createUser' => 'create_user',
                        'updateUser' => 'update_user',
                        'deleteUser' => 'delete_user',
                        'createEmployee' => 'create_employee',
                        'updateEmployee' => 'update_employee',
                        'deleteEmployee' => 'delete_employee',
                        'createLocation' => 'create_location',
                        'updateLocation' => 'update_location',
                        'deleteLocation' => 'delete_location',
                        'createProject' => 'create_project',
                        'updateProject' => 'update_project',
                        'deleteProject' => 'delete_project',
                        'createAsset' => 'create_asset',
                        'updateAsset' => 'update_asset',
                        'deleteAsset' => 'delete_asset',
                        'createAuditPlan' => 'create_audit_plan',
                        'updateAuditPlan' => 'update_audit_plan',
                        'deleteAuditPlan' => 'delete_audit_plan',
                        'createCorrectiveAction' => 'create_corrective_action',
                        'updateCorrectiveAction' => 'update_corrective_action',
                        'deleteCorrectiveAction' => 'delete_corrective_action',
                        'updateCorrectiveActionStatus' => 'update_corrective_action_status',
                        'updateAssetStatus' => 'update_asset_status',
                        'requestAuditAccess' => 'request_audit_access',
                        'sendScheduledReminders' => 'send_scheduled_reminders',
                        'sendManualReminders' => 'send_manual_reminders',
                        'login' => 'login',
                        'logout' => 'logout'
                    ];

                    return $actionMap[$mutationName] ?? strtolower($mutationName);
                }

                // Extract query name
                if (preg_match('/query\s+(\w+)/', $query, $matches)) {
                    return 'view_' . strtolower($matches[1]);
                }
            }
            return 'graphql_request';
        }

        // REST API endpoints
        if (str_contains($path, 'api/')) {
            $endpoint = str_replace('api/', '', $path);

            if ($method === 'POST') {
                return 'create_' . str_replace('/', '_', $endpoint);
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                return 'update_' . str_replace('/', '_', $endpoint);
            } elseif ($method === 'DELETE') {
                return 'delete_' . str_replace('/', '_', $endpoint);
            } else {
                return 'view_' . str_replace('/', '_', $endpoint);
            }
        }

        // Page views
        return 'page_view';
    }

    /**
     * Generate a human-readable description.
     */
    private function generateDescription(Request $request, string $action): string
    {
        $method = $request->method();
        $path = $request->path();

        if (str_contains($path, 'graphql')) {
            $body = $request->input();
            if (isset($body['query'])) {
                $query = $body['query'];
                $variables = $body['variables'] ?? [];

                // Extract operation name for better description
                if (preg_match('/mutation\s+(\w+)/', $query, $matches)) {
                    $mutationName = $matches[1];

                    // Generate specific descriptions based on mutation and variables
                    return $this->generateSpecificDescription($mutationName, $variables);
                }

                if (preg_match('/query\s+(\w+)/', $query, $matches)) {
                    return 'Viewed data: ' . $matches[1];
                }
            }
            return 'Executed GraphQL operation';
        }

        if (str_contains($path, 'api/')) {
            $endpoint = str_replace('api/', '', $path);
            $action = ucfirst($method) . ' request to ' . $endpoint;
            return $action;
        }

        return 'Viewed page: ' . $path;
    }

    /**
     * Generate specific descriptions based on mutation and variables.
     */
    private function generateSpecificDescription(string $mutationName, array $variables): string
    {
        // Convert PascalCase to camelCase for matching
        $mutationName = lcfirst($mutationName);

        switch ($mutationName) {
            case 'createUser':
                $name = $variables['user']['name'] ?? $variables['user']['email'] ?? 'Unknown';
                return "Created user account: {$name}";

            case 'updateUser':
                $id = $variables['id'] ?? 'Unknown ID';
                $name = $variables['user']['name'] ?? $variables['user']['email'] ?? 'Unknown';
                return "Updated user account (ID: {$id}): {$name}";

            case 'deleteUser':
                $id = $variables['id'] ?? 'Unknown ID';
                return "Deleted user account (ID: {$id})";

            case 'createEmployee':
                $name = $variables['employee']['name'] ?? $variables['employee']['employee_id'] ?? 'Unknown';
                return "Created employee: {$name}";

            case 'updateEmployee':
                $id = $variables['id'] ?? 'Unknown ID';
                $name = $variables['employee']['name'] ?? $variables['employee']['employee_id'] ?? 'Unknown';
                return "Updated employee (ID: {$id}): {$name}";

            case 'deleteEmployee':
                $id = $variables['id'] ?? 'Unknown ID';
                return "Deleted employee (ID: {$id})";

            case 'createLocation':
                $name = $variables['location']['name'] ?? 'Unknown';
                return "Created location: {$name}";

            case 'updateLocation':
                $id = $variables['id'] ?? 'Unknown ID';
                $name = $variables['location']['name'] ?? 'Unknown';
                return "Updated location (ID: {$id}): {$name}";

            case 'deleteLocation':
                $id = $variables['id'] ?? 'Unknown ID';
                return "Deleted location (ID: {$id})";

            case 'createProject':
                $name = $variables['project']['name'] ?? 'Unknown';
                return "Created project: {$name}";

            case 'updateProject':
                $id = $variables['id'] ?? 'Unknown ID';
                $name = $variables['project']['name'] ?? 'Unknown';
                return "Updated project (ID: {$id}): {$name}";

            case 'deleteProject':
                $id = $variables['id'] ?? 'Unknown ID';
                return "Deleted project (ID: {$id})";

            case 'createAsset':
                $type = $variables['asset']['type'] ?? 'Unknown type';
                $id = $variables['asset']['asset_id'] ?? $variables['asset']['id'] ?? 'Unknown ID';
                return "Created {$type} asset: {$id}";

            case 'updateAsset':
                $id = $variables['id'] ?? 'Unknown ID';
                $type = $variables['asset']['type'] ?? 'Unknown type';
                return "Updated {$type} asset (ID: {$id})";

            case 'deleteAsset':
                $id = $variables['id'] ?? 'Unknown ID';
                return "Deleted asset (ID: {$id})";

            case 'upsertAsset':
                $assetId = $variables['asset']['asset_id'] ?? $variables['asset']['id'] ?? 'Unknown ID';
                $type = $variables['asset']['type'] ?? 'Unknown type';
                return "Upserted {$type} asset: {$assetId}";

            case 'bulkUpsertAssets':
                $count = is_array($variables['assets']) ? count($variables['assets']) : 0;
                return "Bulk upserted {$count} assets";

            case 'deleteAsset':
                $assetId = $variables['asset_id'] ?? 'Unknown ID';
                return "Deleted asset: {$assetId}";

            case 'upsertEmployee':
                $name = $variables['employee']['name'] ?? $variables['employee']['employee_id'] ?? 'Unknown';
                return "Upserted employee: {$name}";

            case 'bulkUpsertEmployees':
                $count = is_array($variables['employees']) ? count($variables['employees']) : 0;
                return "Bulk upserted {$count} employees";

            case 'upsertProject':
                $name = $variables['project']['name'] ?? 'Unknown';
                return "Upserted project: {$name}";

            case 'bulkUpsertProjects':
                $count = is_array($variables['projects']) ? count($variables['projects']) : 0;
                return "Bulk upserted {$count} projects";

            case 'upsertLocation':
                $name = $variables['location']['name'] ?? 'Unknown';
                return "Upserted location: {$name}";

            case 'createAuditPlan':
                $name = $variables['name'] ?? 'Unknown';
                return "Created audit plan: {$name}";

            case 'updateAuditPlan':
                $id = $variables['id'] ?? 'Unknown ID';
                $name = $variables['name'] ?? 'Unknown';
                return "Updated audit plan (ID: {$id}): {$name}";

            case 'updateAuditAsset':
                $id = $variables['id'] ?? 'Unknown ID';
                $status = $variables['current_status'] ?? 'Unknown status';
                return "Updated audit asset (ID: {$id}) status to: {$status}";

            case 'completeAuditAssignment':
                $id = $variables['id'] ?? 'Unknown ID';
                $status = $variables['status'] ?? 'Unknown status';
                return "Completed audit assignment (ID: {$id}) with status: {$status}";

            case 'deleteAuditPlan':
                $id = $variables['id'] ?? 'Unknown ID';
                return "Deleted audit plan (ID: {$id})";

            case 'createCorrectiveAction':
                $title = $variables['action']['title'] ?? $variables['action']['description'] ?? 'Unknown';
                return "Created corrective action: {$title}";

            case 'updateCorrectiveAction':
                $id = $variables['id'] ?? 'Unknown ID';
                $title = $variables['action']['title'] ?? $variables['action']['description'] ?? 'Unknown';
                return "Updated corrective action (ID: {$id}): {$title}";

            case 'updateCorrectiveActionStatus':
                $id = $variables['id'] ?? 'Unknown ID';
                $status = $variables['status'] ?? 'Unknown status';
                return "Updated corrective action status (ID: {$id}) to: {$status}";

            case 'deleteCorrectiveAction':
                $id = $variables['id'] ?? 'Unknown ID';
                return "Deleted corrective action (ID: {$id})";

            case 'assignCorrectiveAction':
                $actionId = $variables['corrective_action_id'] ?? 'Unknown ID';
                $employeeId = $variables['assigned_to_employee_id'] ?? 'Unknown ID';
                return "Assigned corrective action (ID: {$actionId}) to employee (ID: {$employeeId})";

            case 'updateCorrectiveActionAssignmentStatus':
                $id = $variables['id'] ?? 'Unknown ID';
                $status = $variables['status'] ?? 'Unknown status';
                return "Updated corrective action assignment status (ID: {$id}) to: {$status}";

            case 'updateEmployeeCorrectiveActionStatus':
                $actionId = $variables['action_id'] ?? 'Unknown ID';
                $status = $variables['status'] ?? 'Unknown status';
                $employeeId = $variables['employee_id'] ?? 'Unknown ID';
                return "Updated employee corrective action status (Action ID: {$actionId}, Employee ID: {$employeeId}) to: {$status}";

            case 'updateAssetStatus':
                $assetId = $variables['assetId'] ?? 'Unknown ID';
                $status = $variables['status'] ?? 'Unknown status';
                return "Updated asset status (ID: {$assetId}) to: {$status}";

            case 'requestAuditAccess':
                $email = $variables['email'] ?? 'Unknown email';
                $planId = $variables['audit_plan_id'] ?? 'Unknown plan';
                return "Requested audit access for: {$email} (Plan ID: {$planId})";

            case 'sendScheduledReminders':
                return "Sent scheduled corrective action reminders";

            case 'sendManualReminders':
                $actionIds = $variables['actionIds'] ?? [];
                $count = is_array($actionIds) ? count($actionIds) : 0;
                return "Sent manual reminders for {$count} corrective actions";

            case 'login':
                return "Logged into the system";

            case 'logout':
                return "Logged out of the system";

            case 'createActivityLog':
                $action = $variables['input']['action'] ?? 'Unknown action';
                return "Created activity log: {$action}";

            case 'logActivity':
                $action = $variables['action'] ?? 'Unknown action';
                return "Logged activity: {$action}";

            default:
                return "Executed GraphQL mutation: {$mutationName}";
        }
    }

    /**
     * Check if this is a GraphQL introspection query.
     */
    private function isIntrospectionQuery(Request $request): bool
    {
        if ($request->is('api/graphql') && $request->isMethod('POST')) {
            $input = $request->input();
            if (isset($input['query'])) {
                $query = $input['query'];
                // Check for introspection queries
                return strpos($query, '__schema') !== false ||
                    strpos($query, '__type') !== false ||
                    strpos($query, '__typename') !== false;
            }
        }
        return false;
    }

    /**
     * Check if this is a CRUD operation that should be logged.
     */
    private function isCrudOperation(Request $request): bool
    {
        // For GraphQL requests, check if it's a mutation (Create, Update, Delete)
        if ($request->is('api/graphql') && $request->isMethod('POST')) {
            $input = $request->input();
            if (isset($input['query'])) {
                $query = $input['query'];

                // Check for CRUD mutations
                $crudMutations = [
                    'createUser',
                    'updateUser',
                    'deleteUser',
                    'createEmployee',
                    'updateEmployee',
                    'deleteEmployee',
                    'upsertEmployee',
                    'bulkUpsertEmployees',
                    'createLocation',
                    'updateLocation',
                    'deleteLocation',
                    'upsertLocation',
                    'createProject',
                    'updateProject',
                    'deleteProject',
                    'upsertProject',
                    'bulkUpsertProjects',
                    'createAsset',
                    'updateAsset',
                    'upsertAsset',
                    'bulkUpsertAssets',
                    'deleteAsset',
                    'createAuditPlan',
                    'updateAuditPlan',
                    'deleteAuditPlan',
                    'createCorrectiveAction',
                    'updateCorrectiveAction',
                    'deleteCorrectiveAction',
                    'updateCorrectiveActionStatus',
                    'assignCorrectiveAction',
                    'updateCorrectiveActionAssignmentStatus',
                    'updateEmployeeCorrectiveActionStatus',
                    'updateAuditAsset',
                    'completeAuditAssignment',
                    'updateAssetStatus',
                    'requestAuditAccess',
                    'sendScheduledReminders',
                    'sendManualReminders'
                ];

                foreach ($crudMutations as $mutation) {
                    if (strpos($query, $mutation) !== false) {
                        return true;
                    }
                }

                // Also log login/logout operations
                if (strpos($query, 'login') !== false || strpos($query, 'logout') !== false) {
                    return true;
                }

                return false;
            }
        }

        // For REST API requests, check HTTP methods
        if ($request->is('api/*')) {
            $method = $request->method();
            $path = $request->path();

            // Log POST (Create), PUT/PATCH (Update), DELETE operations
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                return true;
            }

            // Don't log GET requests (Read operations) unless they're specific endpoints
            return false;
        }

        return false;
    }

    /**
     * Get additional metadata for the activity log.
     */
    private function getMetadata(Request $request, $response): array
    {
        $metadata = [
            'method' => $request->method(),
            'path' => $request->path(),
            'status_code' => $response->getStatusCode(),
        ];

        // Add request parameters (excluding sensitive data)
        $params = $request->except(['password', 'token', 'secret']);
        if (!empty($params)) {
            $metadata['parameters'] = $params;
        }

        // Add response size if available
        if (method_exists($response, 'getContent')) {
            $metadata['response_size'] = strlen($response->getContent());
        }

        return $metadata;
    }
}