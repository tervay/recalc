import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import GenericSelect from "common/components/io/new/inputs/L3/GenericSelect";
import { Column, Columns } from "common/components/styling/Building";
import {
  TBAMatch,
  TBARankings,
  TBASimpleEvent,
  TBATeam,
  sortMatches,
  tbaFetch,
} from "common/models/TBA";
import { useState } from "react";

const queryClient = new QueryClient();

const cloudFnUrl =
  "https://us-central1-recalc-1590210745953.cloudfunctions.net/recalc_entrypoint_fn-8235106";

function makeCloudUrl(eventKey: string, method: string): string {
  return `${cloudFnUrl}?event=${eventKey}&method=${method}`;
}

function TeamsCSVOutput(props: { eventKey: string }): JSX.Element {
  const { data } = useQuery({
    queryKey: ["teams", props.eventKey],
    queryFn: async () => {
      const res = await tbaFetch(`event/${props.eventKey}/teams`);
      const data = (await res.json()) as TBATeam[];
      return data;
    },
  });

  const headerRow = ["Team #", "Nickname", "City", "State", "Country"];

  return (
    <div>
      <h1 className="is-size-3">Teams</h1>
      <div className="is-size-5">
        <a href={makeCloudUrl(props.eventKey, "teams")}>Importable URL</a>
      </div>
      <textarea
        wrap="off"
        readOnly
        rows={20}
        className="textarea"
        placeholder="Loading..."
        value={
          headerRow.join(",") +
          "\n" +
          (data ?? [])
            .sort((a, b) => a.team_number - b.team_number)
            .map((team) =>
              [
                team.team_number.toString(),
                team.nickname,
                team.city,
                team.state_prov,
                team.country,
              ]
                .map((s) => s.replaceAll(",", ";"))
                .join(","),
            )
            .join("\n")
        }
      />
    </div>
  );
}

function ScheduleCSVOutput(props: { eventKey: string }): JSX.Element {
  const { data } = useQuery({
    queryKey: ["schedule", props.eventKey],
    queryFn: async () => {
      const res = await tbaFetch(`event/${props.eventKey}/matches/simple`);
      const data = (await res.json()) as TBAMatch[];
      return data;
    },
  });

  const headerRow = [
    "Key",
    "Comp Level",
    "Set Num",
    "Match Num",
    "R1",
    "R2",
    "R3",
    "B1",
    "B2",
    "B3",
    "Red Score",
    "Blue Score",
  ];

  return (
    <div>
      <h1 className="is-size-3">Schedule</h1>
      <div className="is-size-5">
        <a href={makeCloudUrl(props.eventKey, "schedule")}>Importable URL</a>
      </div>
      <textarea
        wrap="off"
        readOnly
        rows={20}
        className="textarea"
        placeholder="Loading..."
        value={
          headerRow.join(",") +
          "\n" +
          sortMatches(data ?? [])
            .map((match) =>
              [
                match.key,
                match.comp_level,
                match.set_number.toString(),
                match.match_number.toString(),
              ]
                .concat(
                  match.alliances.red.team_keys.map((tk) => tk.substring(3)),
                )
                .concat(
                  match.alliances.blue.team_keys.map((tk) => tk.substring(3)),
                )
                .concat([
                  match.alliances.red.score.toString(),
                  match.alliances.blue.score.toString(),
                ])
                .join(","),
            )
            .join("\n")
        }
      />
    </div>
  );
}

function COPRSOutput(props: { eventKey: string }): JSX.Element {
  const { data } = useQuery({
    queryKey: ["coprs", props.eventKey],
    queryFn: async () => {
      const res = await tbaFetch(`event/${props.eventKey}/coprs`);
      const data = (await res.json()) as Record<string, Record<string, number>>;
      return data;
    },
  });

  if (!data) {
    return <div>Loading...</div>;
  }

  if (Object.keys(data).length === 0) {
    return <div>No COPRs available for event :(</div>;
  }

  const headerRow = ["Team #"].concat(Object.keys(data ?? {}));

  const dataRows = Object.keys(data[headerRow[1]]).map((teamKey) =>
    [teamKey.substring(3)].concat(
      Object.keys(data)
        .map((coprKey) => data[coprKey][teamKey])
        .toString(),
    ),
  );

  dataRows.sort((a, b) => Number.parseInt(a[0]) - Number.parseInt(b[0]));

  return (
    <div>
      <h1 className="is-size-3">COPRs</h1>
      <div className="is-size-5">
        <a href={makeCloudUrl(props.eventKey, "coprs")}>Importable URL</a>
      </div>
      <textarea
        readOnly
        wrap="off"
        rows={12}
        className="textarea"
        placeholder="Loading..."
        value={
          headerRow.join(",") +
          "\n" +
          dataRows.map((row) => row.join(",")).join("\n")
        }
      />
    </div>
  );
}

function RankingsOutput(props: { eventKey: string }): JSX.Element {
  const { data } = useQuery({
    queryKey: ["rankings", props.eventKey],
    queryFn: async () => {
      const res = await tbaFetch(`event/${props.eventKey}/rankings`);
      const data = (await res.json()) as TBARankings;
      return data;
    },
  });

  if (!data) {
    return <div>Loading...</div>;
  }

  const headerRow = ["Rank", "Team #"]
    .concat(
      data.sort_order_info
        .map((i) => i.name)
        .concat(
          [...Array(6 - data.sort_order_info.length)].map((_) => "Reserved"),
        ),
    )
    .concat(data.extra_stats_info.map((i) => i.name))
    .concat(["Played"])
    .join(",");

  return (
    <div>
      <h1 className="is-size-3">Rankings</h1>
      <div className="is-size-5">
        <a href={makeCloudUrl(props.eventKey, "rankings")}>Importable URL</a>
      </div>
      <textarea
        readOnly
        wrap="off"
        rows={20}
        className="textarea"
        placeholder="Loading..."
        value={
          headerRow +
          "\n" +
          data.rankings
            .map((row) =>
              [
                row.rank.toString(),
                row.team_key.substring(3),
                ...row.sort_orders.map((n) => n.toString()),
                ...row.extra_stats.map((n) => n.toString()),
                row.matches_played.toString(),
              ].join(","),
            )
            .join("\n")
        }
      />
    </div>
  );
}

function QueryComponents() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [event, setEvent] = useState<TBASimpleEvent | undefined>(undefined);
  const [events, setEvents] = useState<TBASimpleEvent[]>([]);

  const years = Array.from(
    { length: new Date().getFullYear() + 1 - 1991 },
    (_, i) => (1992 + i).toString(),
  );

  const {} = useQuery({
    queryKey: ["events", year],
    queryFn: async () => {
      const res = await tbaFetch(`events/${year}/simple`);
      const data = (await res.json()) as TBASimpleEvent[];
      data.sort((a, b) => a.name.localeCompare(b.name));
      setEvents(data);
      setEvent(data[0]);
      return data;
    },
  });

  return (
    <>
      <p className="is-size-2">Scouting CSV Generators</p>
      <p className="is-size-x">
        These can be copy-pasted into spreadsheets for use offline. You can also
        use the importable URLs with <code>IMPORTHTML</code> like so:
        <pre>=IMPORTHTML("insert url here", "TABLE")</pre>
      </p>
      <br />

      <Columns formColumns>
        <Column narrow>
          <GenericSelect
            choices={years}
            stateHook={[year, setYear]}
            makeString={(s) => s.toString()}
            fromString={(s) => Number.parseInt(s)}
          />
        </Column>
        <Column>
          <GenericSelect
            choices={events.map((e) => e.name)}
            stateHook={[event, setEvent]}
            makeString={(e) => e?.name || ""}
            fromString={(s) => events.find((e) => e.name === s)!}
          />
        </Column>
      </Columns>

      <Columns>
        <Column>{event && <TeamsCSVOutput eventKey={event.key} />}</Column>
        <Column>{event && <ScheduleCSVOutput eventKey={event.key} />}</Column>
        <Column>{event && <RankingsOutput eventKey={event.key} />}</Column>
      </Columns>

      <Columns>
        <Column>{event && <COPRSOutput eventKey={event.key} />}</Column>
      </Columns>
    </>
  );
}

export default function CsvGenerators(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryComponents />
    </QueryClientProvider>
  );
}
