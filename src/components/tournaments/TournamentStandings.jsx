import React from "react";
import { Trophy, Medal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TournamentStandings({ teams, matches }) {
  // Calculate standings from matches
  const standings = teams.map(team => {
    const teamMatches = matches.filter(m => 
      m.status === "completed" &&
      (m.home_team_id === team.id || m.away_team_id === team.id)
    );

    let played = 0, won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;

    teamMatches.forEach(match => {
      played++;
      const isHome = match.home_team_id === team.id;
      const teamScore = isHome ? match.home_score : match.away_score;
      const oppScore = isHome ? match.away_score : match.home_score;

      goalsFor += teamScore || 0;
      goalsAgainst += oppScore || 0;

      if (teamScore > oppScore) won++;
      else if (teamScore < oppScore) lost++;
      else drawn++;
    });

    const points = (won * 3) + drawn;
    const goalDiff = goalsFor - goalsAgainst;

    return {
      ...team,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDiff,
      points
    };
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });

  // Group by group if exists
  const groups = [...new Set(teams.map(t => t.group).filter(Boolean))];
  
  if (groups.length > 0) {
    return (
      <div className="space-y-6">
        {groups.sort().map(group => {
          const groupTeams = standings.filter(t => t.group === group);
          return (
            <Card key={group}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Grupo {group}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <StandingsTable teams={groupTeams} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Tabla de Posiciones
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <StandingsTable teams={standings} />
      </CardContent>
    </Card>
  );
}

function StandingsTable({ teams }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead className="text-center w-10">PJ</TableHead>
            <TableHead className="text-center w-10">G</TableHead>
            <TableHead className="text-center w-10">E</TableHead>
            <TableHead className="text-center w-10">P</TableHead>
            <TableHead className="text-center w-10">GF</TableHead>
            <TableHead className="text-center w-10">GC</TableHead>
            <TableHead className="text-center w-10">DG</TableHead>
            <TableHead className="text-center w-12 font-bold">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team, idx) => (
            <TableRow key={team.id} className={idx < 2 ? "bg-green-50" : ""}>
              <TableCell>
                <div className="flex items-center justify-center">
                  {idx === 0 ? (
                    <Trophy className="h-4 w-4 text-amber-500" />
                  ) : idx === 1 ? (
                    <Medal className="h-4 w-4 text-slate-400" />
                  ) : (
                    <span className="text-slate-500">{idx + 1}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell className="text-center">{team.played}</TableCell>
              <TableCell className="text-center text-green-600">{team.won}</TableCell>
              <TableCell className="text-center text-slate-500">{team.drawn}</TableCell>
              <TableCell className="text-center text-red-600">{team.lost}</TableCell>
              <TableCell className="text-center">{team.goalsFor}</TableCell>
              <TableCell className="text-center">{team.goalsAgainst}</TableCell>
              <TableCell className="text-center">
                <span className={team.goalDiff > 0 ? "text-green-600" : team.goalDiff < 0 ? "text-red-600" : ""}>
                  {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                </span>
              </TableCell>
              <TableCell className="text-center font-bold text-lg">{team.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}