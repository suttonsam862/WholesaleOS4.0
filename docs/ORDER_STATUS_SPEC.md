# Order Status Specification - WholesaleOS

## Lifecycle Overview
The order lifecycle follows a strict sequence to ensure data integrity and clear communication between departments.

| Status | Code | Description | Next Actions |
| :--- | :--- | :--- | :--- |
| **Order Placed** | `new` | Initial sales entry. | Attach Design Job, Collect Sizes |
| **Awaiting Sizes** | `waiting_sizes` | Design approved, waiting for size breakdown from customer. | Customer Portal Entry |
| **Design Created** | `design_created` | Design work in progress or completed. | Design Approval |
| **Sizes Confirmed** | `sizes_validated` | Sizes collected and verified by Sales/Ops. | Send Invoice |
| **Invoiced** | `invoiced` | Invoice sent to customer. | Payment Receipt |
| **In Production** | `production` | Payment received or approved for start. | Manufacturing Job Creation |
| **Shipped** | `shipped` | Order has left the facility. | Tracking Info Entry |
| **Completed** | `completed` | Order delivered and finalized. | Archive |
| **Cancelled** | `cancelled` | Order terminated. | N/A |

## Transitions & Rules
1. **Design Approval**: Required before status can move past `design_created`.
2. **Size Validation**: Required before status can move to `invoiced`.
3. **Payment**: Standard policy requires 50% deposit or full payment before `production` status (role-dependent override available for Admins).
