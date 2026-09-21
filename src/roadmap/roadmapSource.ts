import type { CareerPlan, KnowledgeSource } from "./types";
import { CAREER_PLANS, KNOWLEDGE_LABEL, KNOWLEDGE_VERSION } from "./catalog";

const apiBase = import.meta.env.VITE_GRADIVO_ROADMAP_API as string | undefined;

export async function loadKnowledgeSource(): Promise<{
  source: KnowledgeSource;
  plans: Record<string, CareerPlan>;
}> {
  if (apiBase) {
    try {
      const response = await fetch(`${apiBase.replace(/\/$/, "")}/roadmap/catalog`);
      if (response.ok) {
        const data = (await response.json()) as {
          version?: string;
          plans?: Record<string, CareerPlan>;
        };
        if (data.plans) {
          return {
            source: {
              version: data.version ?? "api",
              isLive: true,
              label:
                "This roadmap includes catalog data from the Gradivo roadmap API.",
            },
            plans: data.plans,
          };
        }
      }
    } catch {
      // Fall through to the local catalog. Never pretend the API succeeded.
    }
  }

  return {
    source: {
      version: KNOWLEDGE_VERSION,
      isLive: false,
      label: KNOWLEDGE_LABEL,
    },
    plans: CAREER_PLANS,
  };
}
