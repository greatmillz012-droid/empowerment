export const empowermentTypes = [
  { value: "skills-training", label: "Skills training", detail: "Build practical, in-demand skills." },
  { value: "business-support", label: "Business support", detail: "Turn an idea into a stronger business." },
  { value: "mentorship", label: "Mentorship", detail: "Learn with guidance from experienced people." },
  { value: "career-development", label: "Career development", detail: "Get ready for your next opportunity." },
] as const;

export type EmpowermentType = (typeof empowermentTypes)[number]["value"];

export function isEmpowermentType(value: string): value is EmpowermentType {
  return empowermentTypes.some((option) => option.value === value);
}

export function empowermentLabel(value: string | null) {
  return empowermentTypes.find((option) => option.value === value)?.label ?? "Not selected";
}
