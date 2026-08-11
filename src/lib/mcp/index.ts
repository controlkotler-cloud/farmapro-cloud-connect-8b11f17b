import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCourses from "./tools/list-courses";
import listResources from "./tools/list-resources";
import listEvents from "./tools/list-events";
import listForumThreads from "./tools/list-forum-threads";
import myProgress from "./tools/my-progress";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "farmapro-cloud-connect",
  title: "Farmapro Cloud Connect",
  version: "0.1.0",
  instructions:
    "Herramientas del portal farmapro (formación y comunidad para farmacias). Permiten consultar cursos, recursos descargables, eventos, hilos del foro y el progreso del usuario conectado. Responde siempre en castellano y escribe 'farmapro' en minúsculas.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCourses, listResources, listEvents, listForumThreads, myProgress],
});
