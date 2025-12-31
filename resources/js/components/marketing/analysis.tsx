import {
    DownloadIcon,
    FilterIcon,
    TrendingUpIcon,
  } from "lucide-react";
  
  import Container from "../global/container";
  import { Button } from "../ui/button";
  import { MagicCard } from "../ui/magic-card";
  import  MagicBadge  from "../ui/magic-badge";

  
  const Analysis = () => {
    return (
      <div className="relative flex flex-col items-center justify-center w-full py-20">
        <Container>
        {/* MagicBadge */}
        <div className="relative hidden lg:flex items-center justify-center overflow-visible pt-2">
          <MagicBadge title="Analyses" />
        </div>
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-heading font-medium !leading-snug">
              Analyses détaillées des locations <br />
              <span className="font-subheading italic">en temps réel</span>
            </h2>
            <p className="text-base md:text-lg text-accent-foreground/80 mt-4">
              Suivez les performances, l’engagement et les tendances de partage directement depuis le tableau de bord Taliani Auto.
            </p>
          </div>
        </Container>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative w-full">
          {[...Array(2)].map((_, i) => (
            <Container key={i} delay={0.2}>
              <div className="rounded-2xl bg-background/40 relative border border-border/50">
                <MagicCard
                  gradientFrom="#38bdf8"
                  gradientTo="#3b82f6"
                  gradientColor="rgba(59,130,246,0.1)"
                  className="p-4 lg:p-8 w-full overflow-hidden"
                >
                  <div className={`absolute bottom-0 right-0 ${i === 0 ? "bg-blue-500" : "bg-sky-500"} w-1/4 h-1/4 blur-[8rem] z-20`}></div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">
                      {i === 0 ? "Performance des dossiers" : "Engagement des utilisateurs"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {i === 0
                        ? "Suivez les vues, interactions et visibilité de vos dossiers de location."
                        : "Comprenez comment les utilisateurs consultent et partagent vos contenus et d’où viennent les visites."}
                    </p>
  
                    <div className="space-y-4">
                      <div className="flex justify-between items-baseline">
                        <div>
                          <div className="text-3xl font-semibold">
                            {i === 0 ? "98 204 vues" : "43 019 utilisateurs"}
                          </div>
                          <div className="text-sm text-green-500 flex items-center gap-1 mt-2">
                            <TrendingUpIcon className="w-4 h-4" />
                            {i === 0 ? "+37 % cette semaine" : "+18 % cette semaine"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" aria-label="Filtrer les options">
                            <FilterIcon className="w-5 h-5" />
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Télécharger les données">
                            <DownloadIcon className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
  
                      {/* Table Section */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 text-sm text-muted-foreground py-2">
                          {i === 0 ? (
                            <>
                              <div>Dossier</div>
                              <div>Vues</div>
                              <div>Uniques</div>
                              <div>CTR</div>
                            </>
                          ) : (
                            <>
                              <div>Source</div>
                              <div>Utilisateurs</div>
                              <div>Sessions</div>
                              <div>Taux de rebond</div>
                            </>
                          )}
                        </div>
                        {(i === 0
                          ? [
                              { title: "Top 10 locations", views: "34K", shares: "8.4K", ctr: "21%" },
                              { title: "Extensions de contrat", views: "26K", shares: "6.1K", ctr: "19%" },
                              { title: "Offres promotionnelles", views: "21K", shares: "3.2K", ctr: "13%" },
                            ]
                          : [
                              { source: "Telegram", users: "19K", sessions: "27K", bounce: "32%" },
                              { source: "Reddit", users: "12K", sessions: "15K", bounce: "26%" },
                              { source: "Recherche", users: "8K", sessions: "13K", bounce: "29%" },
                            ]
                        ).map((item) => (
                          <div
                            key={i === 0 ? item.title : item.source}
                            className="grid grid-cols-4 text-sm py-2 border-t border-border/50"
                          >
                            {i === 0 ? (
                              <>
                                <div>{item.title}</div>
                                <div>{item.views}</div>
                                <div>{item.shares}</div>
                                <div className="font-semibold">{item.ctr}</div>
                              </>
                            ) : (
                              <>
                                <div>{item.source}</div>
                                <div>{item.users}</div>
                                <div>{item.sessions}</div>
                                <div className="font-semibold">{item.bounce}</div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </MagicCard>
              </div>
            </Container>
          ))}
        </div>
      </div>
    );
  };
  
  export default Analysis;
  