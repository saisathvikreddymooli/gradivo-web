import {
  CSS_LANGUAGE_RESOURCES,
  HTML_LANGUAGE_RESOURCES,
  LEARNING_PLAYLISTS,
  SQL_LANGUAGE_RESOURCES,
  type LearningPlaylist,
  type ProgrammingLanguageId,
  type SpokenLanguage,
} from "./playlists";

export type LearnVideoResource = {
  videoId: string;
  language: ProgrammingLanguageId;
  spokenLanguage: SpokenLanguage;
  title: string;
  channel: string;
  url: string;
  thumbnail?: string;
  thumbnailFallback?: string;
};

function videoIdFromUrl(url?: string): string | null {
  if (!url) return null;
  return url.match(/(?:youtu\.be\/|[?&]v=|\/live\/)([\w-]{11})/)?.[1] ?? null;
}

function fromPlaylist(item: LearningPlaylist): LearnVideoResource | null {
  const videoId = videoIdFromUrl(item.url) ?? item.firstVideoId ?? null;
  if (!videoId || !item.url) return null;
  return {
    videoId,
    language: item.language,
    spokenLanguage: item.spoken,
    title: item.title,
    channel: item.channel,
    url: item.url,
    thumbnail: item.thumbnail,
    thumbnailFallback: item.thumbnailFallback,
  };
}

const staticVideoResources = [
  ["css", CSS_LANGUAGE_RESOURCES],
  ["html", HTML_LANGUAGE_RESOURCES],
  ["sql", SQL_LANGUAGE_RESOURCES],
] as const;

export const LEARN_VIDEO_CATALOG: LearnVideoResource[] = [
  ...LEARNING_PLAYLISTS.flatMap((item) => {
    const resource = fromPlaylist(item);
    return resource ? [resource] : [];
  }),
  ...staticVideoResources.flatMap(([language, languageResources]) =>
    (Object.entries(languageResources) as [SpokenLanguage, Omit<LearningPlaylist, "language" | "spoken">[]][])
      .flatMap(([spokenLanguage, resources]) => resources.flatMap((resource) => {
        const videoId = videoIdFromUrl(resource.url);
        return videoId && resource.url ? [{ ...resource, videoId, language, spokenLanguage, url: resource.url }] : [];
      })),
  ),
];

export const SPOKEN_LANGUAGE_LABELS: Record<SpokenLanguage, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  kn: "Kannada",
};
