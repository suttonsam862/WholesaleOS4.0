# RBAC Matrix - WholesaleOS

| Resource | Action | Admin | Sales | Designer | Ops | Manufacturer | Finance | Customer |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Orders** | Read | ✓ | Own | ✓ | ✓ | ✓ | ✓ | Shared |
| | Create | ✓ | ✓ | - | ✓ | - | - | - |
| | Update | ✓ | Own | - | ✓ | - | - | - |
| | Delete | ✓ | - | - | - | - | - | - |
| **Line Items** | Read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Shared |
| | Write | ✓ | ✓ | - | ✓ | - | - | - |
| **Design Jobs** | Read | ✓ | ✓ | ✓ | ✓ | - | - | Shared |
| | Write | ✓ | - | Assigned | ✓ | - | - | - |
| **Manufacturing**| Read | ✓ | ✓ | - | ✓ | ✓ | - | - |
| | Write | ✓ | - | - | ✓ | Assigned | - | - |
| | Update Status| ✓ | - | - | ✓ | Assigned | - | - |
| **Finance** | Read | ✓ | - | - | - | - | ✓ | - |
| | Write | ✓ | - | - | - | - | ✓ | - |
| **Users** | Read | ✓ | - | - | - | - | - | - |
| | Write | ✓ | - | - | - | - | - | - |
| **Events** | Read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| | Write | ✓ | - | - | ✓ | - | - | - |

**Key:**
- `✓`: Full access for the resource.
- `Own`: Access only to records created by or assigned to the user.
- `Assigned`: Access only to records explicitly assigned to the user.
- `Shared`: Access via public shareable links only.
- `-`: No access.
