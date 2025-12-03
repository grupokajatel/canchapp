import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit, Trophy, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_CONFIG = {
  scheduled: { label: "Programado", color: "bg-slate-100 text-slate-700", icon: Clock },
  in_progress: { label: "En Juego", color: "bg-amber-100 text-amber-700", icon: Clock },
  completed: { label: "Finalizado", color: "bg-green-100 text-green-700", icon: CheckCircle },
  postponed: { label: "Aplazado", color: "bg-orange-100 text-orange-700", icon: Clock },
};

function MatchCard({ match, isOrganizer, onEdit }) {
  const statusConfig = STATUS_CONFIG[match.status] || STATUS_CONFIG.scheduled;
  const hasScore = match.home_score !== undefined && match.away_score !== undefined;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Badge className={`text-xs ${statusConfig.color}`}>
            {match.phase === "final" ? "Final" : 
             match.phase === "semifinal" ? "Semifinal" :
             match.phase === "cuartos" ? "Cuartos" :
             match.group ? `Grupo ${match.group}` : 
             `Partido ${match.match_number}`}
          </Badge>
          {isOrganizer && match.status !== "completed" && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(match)}>
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-2">
          {/* Home Team */}
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            hasScore && match.home_score > match.away_score 
              ? "bg-green-50 border border-green-200" 
              : "bg-slate-50"
          }`}>
            <span className={`font-medium text-sm ${
              hasScore && match.home_score > match.away_score ? "text-green-700" : ""
            }`}>
              {match.home_team_name || "TBD"}
            </span>
            {hasScore && (
              <span className="font-bold text-lg">{match.home_score}</span>
            )}
          </div>

          {/* Away Team */}
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            hasScore && match.away_score > match.home_score 
              ? "bg-green-50 border border-green-200" 
              : "bg-slate-50"
          }`}>
            <span className={`font-medium text-sm ${
              hasScore && match.away_score > match.home_score ? "text-green-700" : ""
            }`}>
              {match.away_team_name || "TBD"}
            </span>
            {hasScore && (
              <span className="font-bold text-lg">{match.away_score}</span>
            )}
          </div>
        </div>

        {/* Date/Time */}
        {match.date && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            {format(new Date(match.date), "d MMM", { locale: es })}
            {match.time && ` - ${match.time}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function TournamentBracket({ matches, teams, tournamentType, isOrganizer, onEditMatch }) {
  if (tournamentType === "league") {
    // League view - list of all matches
    const sortedMatches = [...matches].sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return a.match_number - b.match_number;
    });

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Todos los Partidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMatches.map(match => (
            <MatchCard 
              key={match.id} 
              match={match} 
              isOrganizer={isOrganizer}
              onEdit={onEditMatch}
            />
          ))}
        </div>
      </div>
    );
  }

  // Knockout bracket view
  const matchesByPhase = matches.reduce((acc, match) => {
    const phase = match.phase || "round_1";
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(match);
    return acc;
  }, {});

  const phaseOrder = ["round_4", "round_3", "round_2", "cuartos", "semifinal", "final"];
  const phases = phaseOrder.filter(p => matchesByPhase[p]);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8 min-w-max p-4">
        {phases.map((phase, phaseIdx) => (
          <div key={phase} className="flex flex-col gap-4" style={{ minWidth: 220 }}>
            <h3 className="font-semibold text-center text-slate-700 capitalize">
              {phase === "final" ? "🏆 Final" :
               phase === "semifinal" ? "Semifinales" :
               phase === "cuartos" ? "Cuartos de Final" :
               `Ronda ${phase.split('_')[1]}`}
            </h3>
            <div className="flex flex-col gap-4 justify-around flex-1">
              {matchesByPhase[phase]
                .sort((a, b) => a.match_number - b.match_number)
                .map(match => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    isOrganizer={isOrganizer}
                    onEdit={onEditMatch}
                  />
                ))
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}