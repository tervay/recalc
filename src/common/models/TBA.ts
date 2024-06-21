export interface TBASimpleEvent {
  city: string;
  country: string;
  district: TBADistrict | null;
  end_date: string;
  event_code: string;
  event_type: number;
  key: string;
  name: string;
  start_date: string;
  state_prov: string;
  year: number;
}

export interface TBADistrict {
  abbreviation: string;
  display_name: string;
  key: string;
  year: number;
}

export interface TBATeam {
  address: null;
  city: string;
  country: string;
  gmaps_place_id: null;
  gmaps_url: null;
  key: string;
  lat: null;
  lng: null;
  location_name: null;
  motto: null;
  name: string;
  nickname: string;
  postal_code: null | string;
  rookie_year: number;
  school_name: string;
  state_prov: string;
  team_number: number;
  website: null | string;
}

export interface TBAMatch {
  actual_time: number;
  alliances: TBAMatchAlliances;
  comp_level: string;
  event_key: string;
  key: string;
  match_number: number;
  predicted_time: number;
  set_number: number;
  time: number;
  winning_alliance: string;
}

export interface TBAMatchAlliances {
  blue: TBAMatchAlliance;
  red: TBAMatchAlliance;
}

export interface TBAMatchAlliance {
  dq_team_keys: any[];
  score: number;
  surrogate_team_keys: any[];
  team_keys: string[];
}

export interface TBARankings {
  extra_stats_info: TBAInfo[];
  rankings: TBARanking[];
  sort_order_info: TBAInfo[];
}

export interface TBAInfo {
  name: string;
  precision: number;
}

export interface TBARanking {
  dq: number;
  extra_stats: number[];
  matches_played: number;
  qual_average: null;
  rank: number;
  record: TBARecord;
  sort_orders: number[];
  team_key: string;
}

export interface TBARecord {
  losses: number;
  ties: number;
  wins: number;
}

export function sortMatchComparator(a: TBAMatch, b: TBAMatch) {
  const compLevelValues: Record<string, number> = {
    f: 5,
    sf: 4,
    qf: 3,
    ef: 2,
    qm: 1,
  };
  if (a.comp_level !== b.comp_level) {
    return (
      (compLevelValues[a.comp_level] ?? 0) -
      (compLevelValues[b.comp_level] ?? 0)
    );
  }

  return a.set_number - b.set_number || a.match_number - b.match_number;
}

export function sortMatches(matches: TBAMatch[]) {
  return matches.sort(sortMatchComparator);
}

export async function tbaFetch(endpoint: string): ReturnType<typeof fetch> {
  return fetch(`https://www.thebluealliance.com/api/v3/${endpoint}`, {
    headers: {
      "X-TBA-Auth-Key":
        "FfBdTrj0DX7qOqbIaLYYQ0i5HemtJYC2S6OlYl12ODrFdjdpMwG176m0zcL2Jtwn",
    },
  });
}
