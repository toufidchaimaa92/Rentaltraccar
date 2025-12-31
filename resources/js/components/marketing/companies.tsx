import { VelocityScroll } from "../ui/scroll-based-velocity";

const Companies = () => {

    return (
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <VelocityScroll defaultVelocity={2}>Support Markdown Expiration des partages Protection par mot de passe Blocage des liens Mise en évidence du code Mode sombre Analyses des liens Optimisation mobile</VelocityScroll>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
      </div>
    );
  }
export default Companies;
