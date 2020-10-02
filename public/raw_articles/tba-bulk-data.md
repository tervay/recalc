[//]: <author> (Andrew Schreiber)
[//]: <title> (TBA API For Beginners)
[//]: <updated> (10/01/2020)

[[toc]]

## Accessing Bulk TBA Data

As you may have noticed, accessing the TBA API is pretty easy if you need to see one team or one event but what if you wanted to see something else, like how often Team 254 has Red Bumpers. For stuff like that TBA has an mirror of their data to a publicly queryable data set available at https://thebluealliance.com/bigquery.

Simply put, it's a database that you can ask questions. If you're familiar with querying other databases using SQL it should feel fairly similar. 

### Description of Some Tables

#### Team
This table describes information about any FRC Team in the database. This doesn't exactly mean that team ever competed and in some cases [only existed at off season events](https://www.thebluealliance.com/team/666). So, sadly, it's not as easy to find the list of all FRC teams by looking here. 

#### Event
Should be fairly obvious, the only big catch is that it includes off season events. As a general trick you can filter by `event_type_enum < 7` to exclude unofficial events or only include [certain types of events](https://github.com/the-blue-alliance/the-blue-alliance/blob/master/consts/event_type.py#L2), there is also an `official` column that works just as well but doesn't let you exclude things like Einstein which can sometimes skew data. 

#### EventTeam
This is the join table that let's you go between Event and Team. 

#### Match
This is where things get fun, it contains every match TBA has. The catch it's stored oddly because of how the Google infrastructure that TBA works on holds data. This means that getting things like if a team won a match can be difficult. This table joins back on Event, but inside the `alliances_json` you can also join back to Team.

### Querying Data
You'll need to create a project and enable Big Query in it, the good news this is free. At the time of writing it's in a dropdown next to the words "Google Cloud Platform". Let's start with a simple query. 

```
SELECT
  team.name
FROM
  `tbatv-prod-hrd.the_blue_alliance.eventTeam`
WHERE
  event.name = "2014abca"
 ```

 This query is about as simple as it gets. It says to select the `name` on the `team` structure from the `EventTeam` table where the `name` of the `event` is "2014abca". If we wanted to see a different list of teams we could change the event name. The thing to note is that in both of these cases we are actually looking at the `RECORD` type stored on this table, so those names are really the names of the keys. 

 ### Joining Data

 Listening teams that competed in a season is fairly easy, you just need to join to the Event table and filter on the `Event.year`

 ```
 SELECT
  DISTINCT team.name
FROM
  `tbatv-prod-hrd.the_blue_alliance.eventTeam` AS ET
JOIN `tbatv-prod-hrd.the_blue_alliance.event` as E
  ON E.__key__.name = ET.event.name
WHERE
  E.year = 2016
AND E.event_type_enum < 7
```

When you join you need to tell it what table you are joining in and on what. I typically find it nice to alias the table swith an `as` to minimize my typing. 

### Helpful Queries

#### Create a table of team wins

Helpful if you need to find all wins by a team, mostly a base for aggregating the data with GROUP BY and COUNT clauses

```
-- This is a gnarly function to determine if a team won a match. Bear in mind it specifically does won.
-- !won can include lost or tied, it also doesn't account for red cards
CREATE TEMP FUNCTION
  won(team STRING,
    json STRING)
  RETURNS BOOL
  LANGUAGE js AS """
    var alliances = JSON.parse(json);
     var alliance = alliances.blue.teams.indexOf(team) >= 0? "blue": "red"
     var opp_alliance = alliance == "blue" ? "red" : "blue"
     var our_score = alliances[alliance].score;
     var opp_score = alliances[opp_alliance].score;
     return our_score > opp_score;
  """;
SELECT
  tm,
  M.__key__.name as match_id,
  won(tm,
    alliances_json) AS won,
  event.name as event_id,
FROM
  `tbatv-prod-hrd.the_blue_alliance.match` AS M,
  UNNEST(M.team_key_names) AS tm
JOIN `tbatv-prod-hrd.the_blue_alliance.event` AS E
  ON M.event.name = E.__key__.name
WHERE E.year >= 2005
-- Let's be honest, TBA data is sketchy prior to 2005 at best. 
-- Uncomment to limit to a specific team
-- AND tm = 'frc33'

-- Uncomment to limit to a specific event
-- AND E.__key__.name = "2014abca"

-- Uncomment to limit to a specific year
-- AND E.year == 2018

-- Filter out any off seasons, though you could just as easily only grab districts or such
-- https://github.com/the-blue-alliance/the-blue-alliance/blob/master/consts/event_type.py#L2
AND E.event_type_enum < 7

```

#### List teams at an event

Helpful to find a list of teams at an event, just update the event name. 
```
SELECT
  team.name
FROM
  `tbatv-prod-hrd.the_blue_alliance.eventTeam`
WHERE
  event.name = "2014abca"
```

##### Teams that attended BOTH events

This one is actually showing a handy trick, if you construct two sets of things you can do set intersections on them. This would work with most of the queries here. 

```
SELECT
  team.name
FROM
  `tbatv-prod-hrd.the_blue_alliance.eventTeam`
WHERE
  event.name = "2018mimil"
  
INTERSECT DISTINCT 

SELECT
  team.name
FROM
  `tbatv-prod-hrd.the_blue_alliance.eventTeam`
WHERE
  event.name = "2018misou"
```


#### Teams in a season

Maybe less useful for most but still handy to have, bear in mind ordering will be alphanumeric not numeric. 

```
SELECT
  DISTINCT team.name
FROM
  `tbatv-prod-hrd.the_blue_alliance.eventTeam` AS ET
JOIN `tbatv-prod-hrd.the_blue_alliance.event` as E
  ON E.__key__.name = ET.event.name
WHERE
  E.year = 2016
AND E.event_type_enum < 7
```

#### Events a team attended
```
SELECT
  DISTINCT event.name
FROM
  `tbatv-prod-hrd.the_blue_alliance.eventTeam` as ET
JOIN `tbatv-prod-hrd.the_blue_alliance.event` as E
  ON E.__key__.name = ET.event.name
WHERE
  E.year = 2016
  AND team.name = "frc33"
  AND E.event_type_enum < 7
```

#### Awards a team won

```
SELECT
  name_str,
  event.name
FROM
  `tbatv-prod-hrd.the_blue_alliance.award`,
  UNNEST(team_list) AS TM
WHERE
  TM.name = "frc33"
  AND year > 2005
```
