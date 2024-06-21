import functions_framework
from tabulate import tabulate
from tbapy import TBA

tba = TBA("FfBdTrj0DX7qOqbIaLYYQ0i5HemtJYC2S6OlYl12ODrFdjdpMwG176m0zcL2Jtwn")


cors_headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "text/html",
}


def to_html(data):
    return tabulate(data, headers="firstrow", tablefmt="html")


def return_helper(data, code=200):
    return data, code, cors_headers


def teams(event_key: str):
    teams = tba.event_teams(event_key)
    teams.sort(key=lambda x: x.team_number)

    return return_helper(
        to_html(
            [["Team #", "Nickname", "City", "State", "Country"]]
            + [
                [
                    team.team_number,
                    team.nickname,
                    team.city,
                    team.state_prov,
                    team.country,
                ]
                for team in teams
            ]
        ),
        200,
    )


def schedule(event_key: str):
    matches = tba.event_matches(event_key)
    matches.sort(
        key=lambda m: (
            {"f": 5, "sf": 4, "qf": 3, "ef": 2, "qm": 1}[m.comp_level],
            m.set_number,
            m.match_number,
        )
    )

    return return_helper(
        to_html(
            [
                [
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
                ]
            ]
            + [
                [
                    m.key,
                    m.comp_level,
                    m.set_number,
                    m.match_number,
                ]
                + [tk[3:] for tk in m.alliances["red"]["team_keys"]]
                + [tk[3:] for tk in m.alliances["blue"]["team_keys"]]
                + [
                    m.alliances["red"]["score"],
                    m.alliances["blue"]["score"],
                ]
                for m in matches
            ]
        ),
    )


def rankings(event_key: str):
    rankings = tba.event_rankings(event_key)
    rankings.rankings.sort(key=lambda x: x["rank"])

    headers = (
        ["Rank", "Team #"]
        + [x["name"] for x in rankings.sort_order_info]
        + ((6 - len(rankings.sort_order_info)) * ["Reserved"])
        + [x["name"] for x in rankings.extra_stats_info]
        + ["Played"]
    )

    return return_helper(
        to_html(
            [headers]
            + [
                [r["rank"], r["team_key"]]
                + r["sort_orders"]
                + r["extra_stats"]
                + [r["matches_played"]]
                for r in rankings.rankings
            ]
        ),
    )


def coprs(event_key: str):
    coprs = tba._get("event/%s/coprs" % event_key)

    headers = ["Team #"] + list(coprs.keys())
    data = [headers]
    for team in coprs[headers[1]].keys():
        data.append([team] + [coprs[header][team] for header in headers[1:]])

    return return_helper(to_html(data))


@functions_framework.http
def entrypoint(request):
    if request.method == "OPTIONS":
        return_helper({}, 204)

    event_key = request.args.get("event")
    if event_key is None:
        return return_helper("Error: no event specified", 400)

    method = request.args.get("method")
    if method is None:
        return return_helper("Error: no method specified", 400)

    if method == "teams":
        return teams(event_key)
    elif method == "schedule":
        return schedule(event_key)
    elif method == "rankings":
        return rankings(event_key)
    elif method == "coprs":
        return coprs(event_key)

    return return_helper(f"Error: invalid method: {method}", 400)
