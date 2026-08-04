# QA Report


## 1. Creating a CI relationship ignores the `Valid From` value entered by the user

- **Page:** `/ci-relationships`
- **Action:** `Create relationship`
- **Scenario:**
  1. A user opens the create relationship dialog.
  2. The user fills the required fields.
  3. The user sets a custom `Valid From` date.
  4. The user clicks save and sees a success result.
- **Expected:** the relationship should be stored with the same `Valid From` value entered in the form.
- **Actual:** the create action does not pass `Valid From` through the actual save path, so the user-entered value is ignored.
- **Why this matters:** this is a create flow that appears successful, but the stored record is not the same as what the user submitted.
- **Severity:** High
- **Verified:** ✅ Confirmed.

---

## 2. Creating a CI relationship ignores the `Valid To` value entered by the user

- **Page:** `/ci-relationships`
- **Action:** `Create relationship`
- **Scenario:**
  1. A user opens the create relationship dialog.
  2. The user fills the relationship form.
  3. The user sets a custom `Valid To` date.
  4. The user saves and gets a success message.
- **Expected:** the relationship should be stored with the chosen `Valid To` value.
- **Actual:** the create action does not pass `Valid To` into the save path, so the value entered in the form is not actually persisted.
- **Why this matters:** the record is created, but part of the submitted data silently disappears.
- **Severity:** High
- **Verified:** ✅ Confirmed.

---

## 3. Creating a CI relationship can persist a record without fully validating both selected endpoints

- **Page:** `/ci-relationships`
- **Action:** `Create relationship`
- **Scenario:**
  1. A user creates a relationship between two configuration items.
  2. The save flow checks the relationship type.
  3. The relationship is then created.
- **Expected:** both the source item and target item should be validated as real configuration items before the record is saved.
- **Actual:** the create logic validates the relationship type, but does not fully verify both relationship endpoints before persistence.
- **Why this matters:** create can succeed while persisting a relationship that was not fully validated at the domain/use-case layer.
- **Severity:** High
- **Verified:** ✅ Confirmed.

---

## 4. Deleting a vendor can succeed even though not all dependency paths are checked first

- **Page:** `/vendors`
- **Action:** `Delete vendor`
- **Scenario:**
  1. A user opens a vendor record.
  2. The user clicks delete.
  3. The delete flow checks asset usage, then proceeds.
- **Expected:** deletion should be blocked if the vendor is still referenced by related records such as contacts or configuration items.
- **Actual:** the delete logic only enforces one dependency path (`assets`) and leaves other dependency checks incomplete.
- **Why this matters:** delete can appear to work, but it is not safely guarded against all known linked data paths.
- **Severity:** High
- **Verified:** ✅ Confirmed.

---

## 5. Deleting a lifecycle model can succeed even when the model is still in use

- **Page:** `/lifecycle-models`
- **Action:** `Delete lifecycle model`
- **Scenario:**
  1. A user opens a lifecycle model that is already used elsewhere.
  2. The user clicks delete.
  3. The system proceeds with deletion.
- **Expected:** deletion should be blocked while the lifecycle model is still in use by dependent records.
- **Actual:** the delete path does not enforce the in-use protection before removing the model.
- **Why this matters:** delete can succeed even though the record should still be protected by usage checks.
- **Severity:** High
- **Verified:** ✅ Confirmed.

---

## 6. Reading configuration item details does not return the full saved relationship set

- **Page:** `/configuration-items`
- **Action:** `View item details`
- **Scenario:**
  1. A user opens a configuration item detail view.
  2. The user goes to the relationships section.
  3. The item has both active and inactive relationships in storage.
- **Expected:** the detail view should reflect the complete saved relationship set, or clearly expose both active and inactive records.
- **Actual:** the read flow only requests active relationships, so part of the stored relationship data is hidden from the user.
- **Why this matters:** the frontend read behavior does not match the full persisted data state.
- **Severity:** Medium
- **Verified:** ✅ Confirmed.

---

## 7. CI relationship create uses a form contract that is wider than the actual persistence contract

- **Page:** `/ci-relationships`
- **Action:** `Create relationship`
- **Scenario:**
  1. A user opens the create relationship form.
  2. The form presents a richer create payload including validity fields.
  3. The user fills the form and saves successfully.
- **Expected:** every persisted field shown as part of the create form should flow through the actual create action into storage.
- **Actual:** the create form and schema include more data than the action actually sends to persistence.
- **Why this matters:** the user can submit a form successfully while assuming fields were saved when they were not.
- **Severity:** High
- **Verified:** ✅ Confirmed.

---

## 8. Deleting a lifecycle model relies on database constraints instead of application-level validation

- **Page:** `/lifecycle-models`
- **Action:** `Delete lifecycle model`
- **Scenario:**
  1. A user opens a lifecycle model that is still referenced by lifecycle states or transitions.
  2. The user clicks delete.
  3. The system attempts to delete the record.
- **Expected:** the application should block deletion before reaching persistence and return a clear message such as “model is in use”.
- **Actual:** the delete action proceeds directly to the persistence layer and fails with a raw database foreign key constraint error (`lifecycle_states_lifecycleModelId_fkey`).
- **Why this matters:** the delete flow is not guarded at the application level and leaks database-level errors instead of enforcing domain validation.
- **Severity:** High
- **Verified:** ✅ Confirmed.

---

## 9. Deleting a vendor does not validate all dependency paths before attempting deletion

- **Page:** `/vendors`
- **Action:** `Delete vendor`
- **Scenario:**
  1. A user opens a vendor record.
  2. The user clicks delete.
  3. The delete flow checks asset usage only.
  4. The vendor is still referenced by other entities (e.g. configuration items or contacts).
- **Expected:** deletion should be blocked if the vendor is referenced by any dependent records.
- **Actual:** the delete logic checks only one dependency path (`assets`) and may proceed to deletion or rely on database constraints for other dependencies.
- **Why this matters:** the application does not enforce complete dependency validation and may either allow unsafe deletion attempts or surface raw database errors.
- **Severity:** High
- **Verified:** ✅ Confirmed.

---

## 10. Deleting a relationship type relies on database constraints instead of usage validation

- **Page:** `/relationship-types`
- **Action:** `Delete relationship type`
- **Scenario:**
  1. A user opens a relationship type that is already used in CI relationships.
  2. The user clicks delete.
  3. The system attempts to delete the record.
- **Expected:** deletion should be blocked with a clear validation message if the relationship type is in use.
- **Actual:** no application-level usage check is performed, and the delete operation fails due to a database foreign key constraint from `ci_relationships`.
- **Why this matters:** the delete flow lacks proper domain validation and exposes database-level errors instead of controlled application responses.
- **Severity:** High
- **Verified:** ✅ Confirmed.

---

## 11. Deleting a configuration item does not validate relationship dependencies before deletion

- **Page:** `/configuration-items`
- **Action:** `Delete configuration item`
- **Scenario:**
  1. A user opens a configuration item that participates in CI relationships (as source or target).
  2. The user clicks delete.
  3. The system attempts to delete the record.
- **Expected:** deletion should be blocked if the configuration item is referenced in any relationships.
- **Actual:** the delete path does not validate relationship dependencies before attempting deletion and may rely on database constraints to prevent it.
- **Why this matters:** the application does not enforce safe deletion rules and can surface low-level errors or allow inconsistent operations.
- **Severity:** High
- **Verified:** ✅ Confirmed.