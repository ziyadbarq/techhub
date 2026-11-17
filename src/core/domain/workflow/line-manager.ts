/**
 * Who a person's line manager is.
 *
 * The manager from Microsoft Entra ID / Active Directory (Person.managerId,
 * linked by the user sync) comes first. The organisation unit's manager is
 * only a fallback for people with no manager in the directory, and never
 * the person themselves (the head of a unit doesn't approve their own
 * requests). Pure: the form, the engine and the approval step agree.
 */
export function lineManagerPersonId(person: {
  id: string;
  managerId: string | null;
  orgUnitManagerId: string | null;
}): string | null {
  if (person.managerId && person.managerId !== person.id) {
    return person.managerId;
  }
  if (person.orgUnitManagerId && person.orgUnitManagerId !== person.id) {
    return person.orgUnitManagerId;
  }
  return null;
}
