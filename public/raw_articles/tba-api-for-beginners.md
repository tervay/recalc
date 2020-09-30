# Using the TBA API

Author: Justin Tervay

## How does TBA serve data?

TheBlueAlliance stores their data in a database, such as [Google Cloud Datastore](https://cloud.google.com/datastore). However, databases themselves are typically heavily secured, so that bad actors can't intentionally edit the database and corrupt the data (and break the site). So instead, TBA exposes special URLs that return raw data, just like how specific URLs return a webpage. The data format that data is returned in is called [JSON](https://en.wikipedia.org/wiki/JSON) - a widely standardized format that many programming languages can understand.

You can view an example of a JSON response here: https://www.thebluealliance.com/api/v3/status

However, you'll see an error:

```
{"Error": "X-TBA-Auth-Key is a required header or URL param. Please get an access key at http://www.thebluealliance.com/account."}
```

This is because our request to the server didn't have all the information that the server wanted - specifically, we are missing a **header** that tells the server who we are. The reason we have to tell the server who we are is so that TBA (and many other sites that use API authentication practices) can track which users are requesting the most data - while TBA doesn't really do anything with this information, more popular APIs - such as the official League of Legends API or the Google Maps API - can limit how much data is returned to each user in order to prevent servers from being overwhelmed.

Don't worry about the error right now - we'll fix it in our upcoming code.

## Setting up our development environment

Let's stick to the basics here. We'll use Python here since it's very easy to utilize. If you already have a Python environment set up, you're free to skip ahead.

We'll use the [PyCharm educational IDE](https://www.jetbrains.com/pycharm-edu/), since it's a great way for new Python programmers to learn.

When installing, you'll come across this menu screen:

![enter image description here](https://i.imgur.com/Iv5lEtJ.png)

Note that my options for 	`Choose Python version` are greyed out, since I already have both of those Python versions installed. You should choose to  install Python 3.8 if you have not installed it already (Python 2.7 is no longer officially supported). If you don't install any Python version, you won't be able to run the code!

![enter image description here](https://i.imgur.com/vdMTSXe.png)

Make sure you select `Learner` here.

![enter image description here](https://i.imgur.com/Sx6HYJV.png)

Click `New Project`.

![enter image description here](https://i.imgur.com/yD66mQ0.png)

Let's take a step to examine what all this means:

* `Location` is simply the folder on your hard drive where your project will be saved.
* You'll see 3 options for what to use for a "new environment" - for this, we'll simply use `Virtualenv`, or "virtual environment" - this will create a _copy_ of the Python installation inside the folder you specified in `Location`.  The reason for this is a bit out of scope for this tutorial, but effectively it allows for easier separation of concerns when having multiple Python projects on your hard drive that each use their own external libraries.
* The `Base interpreter` is simply which Python version will be copied to the virtual environment. This is used when you have multiple versions of Python installed, such as Python 3.8 and Python 2.7.
* Make sure you select the last option to create a welcome script.

You'll see a window like this:

![enter image description here](https://i.imgur.com/9oV72rb.png)

The first thing to do to make your life a little easier is go to `View -> Appearance -> Toolbar`:

![enter image description here](https://i.imgur.com/Fc9dL1C.png)

Now, we can click the magical green play button to run the script!

![enter image description here](https://i.imgur.com/FTFJwZ1.png)

And you should see a console output the message:

```
Hi, PyCharm
```

## Installing a third-party library

While it's possible to get data from a web API with the Python standard library, it's a lot easier with third-party libraries. My personal favorite and recommended library is [tbapy](https://github.com/frc1418/tbapy). In order to install it, follow these steps:

1. Go to `File -> Settings`.
2. Navigate to `Project: myProject -> Python Interpreter`. ![enter image description here](https://i.imgur.com/AKTpw08.png)
3. You'll see that we have two default libraries installed - `pip` and `setuptools`. `pip` is used to download other libraries, and `setuptools` is used to install and distribute libraries.
4. Click the `+` on the right side.
5. Search for `tbapy`: ![enter image description here](https://i.imgur.com/hdyWEm8.png)
6. Click `Install Package`. 
7. When it's installed successfully, you can close these windows. You may note that you have several more libraries installed, such as `CacheControl`, `certifi`, `chardet`, and others - these are all libraries used by `tbapy`, so they had to be installed too.

## Getting a TBA API Key

You'll want to get a Read API Key from here: https://www.thebluealliance.com/account

Copy the value under `X-TBA-Auth-Key` - that's your API key (and what the error earlier was complaining about you not having!).

![enter image description here](https://i.imgur.com/NJfNrfc.png)

## Getting our first piece of data

Back to PyCharm. The first thing we have to do is _import_ `tbapy` so that our script knows what we are talking about:

```
import tbapy
```

After that, we have to tell `tbapy` what our API key is so that it can go and get data for us:

```
tba = tbapy.TBA("ThisIsMyAPIKey")
```

This creates an instance of the `TBA` class and assigns it to the `tba` variable. The `TBA` class has lots of helper methods to help us get data, such as `status`:

```
print(tba.status())
```

After running, your IDE should look like this:

![enter image description here](https://i.imgur.com/OgCAbG0.png)

You'll see that the console successfully output some information regarding the status of the TBA API! This isn't really any info you probably actually care about, so let's try getting information about a team...

```
import tbapy  
  
tba = tbapy.TBA("ThisIsMyAPIKey")  
print(tba.team(2791))
```

Feel free to swap out `2791` for your own team number. You should get an output like this:

```
Team({'address': None, 'city': 'Latham', 'country': 'USA', 'gmaps_place_id': None, 'gmaps_url': None, 'home_championship': {'2020': 'Detroit'}, 'key': 'frc2791', 'lat': None, 'lng': None, 'location_name': None, 'motto': None, 'name': 'GE Energy (Power and Water)/gcom Software/Google/PVA/The Colden Company Inc/CAPCOM Federal Credit Union/NYSUT/Crisafulli Brothers/Atlas Copco/Price Chopper/Market 32&Shaker High School', 'nickname': 'Shaker Robotics', 'postal_code': '12110', 'rookie_year': 2009, 'school_name': 'Shaker High School', 'state_prov': 'New York', 'team_number': 2791, 'website': 'http://www.team2791.org'})
```

Which looks great! You'll notice that it looks _pretty_ similar to JSON, except it's wrapped in a `Team( ... )` block -- this is just because it's actually printing an instance of a `Team` class that `tbapy` has implemented, and it simply internally stores the JSON representation of a team. You can interact with this `Team` instance just like it was a pure JSON object.

One minor nitpack is that it's all printed on one line, so it can be a little hard for the human eye to parse through. Luckily, Python has some helper methods for that! We'll use [`pprint`](https://docs.python.org/3/library/pprint.html) (short for "pretty print") for that:

![enter image description here](https://i.imgur.com/7MIFwkp.png)

Now we can much more easily see the JSON blob representing team 2791.

## How much is in the API?

A lot! You can see the full API documentation here: https://www.thebluealliance.com/apidocs/v3

And the `tbapy` documentation here: https://github.com/frc1418/tbapy#retrieval-functions

So, lets look at the `tbapy` API docs and explain what those function arguments mean.

For example:

![enter image description here](https://i.imgur.com/UqKWO76.png)

Here, `tba.team` is exactly what we did in the last script we ran! `2791` (or whichever team you put) is `team` parameter - you'll note that the `tbapy` developers noted that you can provide either the team number (`2791`) or the team **key**, which would be a string of `"frc2791"`. Team keys are pretty common within the TBA API and the official FRC APIs.

Next, you'll notice `[simple]` - the brackets simply mean it's an optional parameter. Since the official TBA API has multiple team API endpoints, `tbapy` simply condensed it into one method. You can see the endpoints on the official TBA docs page:

![enter image description here](https://i.imgur.com/5g7wOTd.png)

Clicking on each of those tells you what type of data they each return - in this case, the first method returns a `Team` object, while the second returns a `TeamSimple` object. To find out what these mean, scroll all the way down to the bottom of the TBA page to find these:

![enter image description here](https://i.imgur.com/WhVuEPo.png)

You'll see that `TeamSimple` just returns less data, in case you don't need all of it from the full `Team` model.

So lets print the simple version of our team. To provide the optional `simple` parameter, simply replace `tba.team(2791)` with `tba.team(2791, simple=True)`:

![enter image description here](https://i.imgur.com/nt2Wdvc.png)

## Analyzing the data

Lets say we want to find the average number of district points our team has earned across our 2019 events. First, we need to find all our 2019 events:

```
import tbapy  
from pprint import pprint  
  
tba = tbapy.TBA("ThisIsMyAPIKey")  
all_events = tba.team_events(2168, year=2019)
```

Here, we are getting all events that team 2168 attended in 2019. An example event model looks like:

```
{'address': '100 Institute Rd, Worcester, MA 01609, USA',
  'city': 'Worcester',
  'country': 'USA',
  'district': {'abbreviation': 'ne',
               'display_name': 'New England',
               'key': '2019ne',
               'year': 2019},
  'division_keys': [],
  'end_date': '2019-04-13',
  'event_code': 'necmp',
  'event_type': 2,
  'event_type_string': 'District Championship',
  'first_event_code': 'NECMP',
  'first_event_id': None,
  'gmaps_place_id': 'ChIJdzY3EFkG5IkRrW3cc4Yhw8Y',
  'gmaps_url': 'https://maps.google.com/?cid=14322328101321469357',
  'key': '2019necmp',
  'lat': 42.2745754,
  'lng': -71.8062724,
  'location_name': 'Worcester Polytechnic Institute',
  'name': 'New England District Championship',
  'parent_event_key': None,
  'playoff_type': 0,
  'playoff_type_string': 'Elimination Bracket (8 Alliances)',
  'postal_code': '01609',
  'short_name': 'New England',
  'start_date': '2019-04-10',
  'state_prov': 'MA',
  'timezone': 'America/New_York',
  'webcasts': [{'channel': 'nefirst_red', 'type': 'twitch'},
               {'channel': 'nefirst_blue', 'type': 'twitch'}],
  'website': 'http://www.nefirst.org/',
  'week': 6,
  'year': 2019}
  ```

There is some important info here - notably, it tells us that this was a district championship, and that it was in the `2019ne` district, and also various other details. However, `team_events` gets us _all_ events - including offseasons, which we don't want district points for.

Comparably, an offseason event blob may look like this:

```
{'address': '7802 Hague Rd, Indianapolis, IN 46256, USA',
  'city': 'Indianapolis',
  'country': 'USA',
  'district': None,
  'division_keys': [],
  'end_date': '2019-07-13',
  'event_code': 'iri',
  'event_type': 99,
  'event_type_string': 'Offseason',
  'first_event_code': 'IRI',
  'first_event_id': None,
  'gmaps_place_id': 'ChIJt-fTNsJMa4gRk20afFmPaQU',
  'gmaps_url': 'https://maps.google.com/?cid=390000457241226643',
  'key': '2019iri',
  'lat': 39.8961663,
  'lng': -86.0349536,
  'location_name': 'Lawrence North High School',
  'name': 'Indiana Robotics Invitational',
  'parent_event_key': None,
  'playoff_type': 0,
  'playoff_type_string': 'Elimination Bracket (8 Alliances)',
  'postal_code': '46256',
  'short_name': 'Indiana Robotics Invitational',
  'start_date': '2019-07-12',
  'state_prov': 'IN',
  'timezone': 'America/Indiana/Indianapolis',
  'webcasts': [{'channel': 'firstinspires', 'type': 'twitch'}],
  'website': 'http://indianaroboticsinvitational.org/',
  'week': None,
  'year': 2019}
```
You'll note that `'district'` is `None` - which is the equivalent of `null` in Java or C++.

So lets iterate over all the events and print which ones are district events:

![enter image description here](https://i.imgur.com/cmF4THS.png)

You'll note that we can iterate over all events by `for event in all_events`. We can access a given events district value by `event["district"]`. We check if its not `None` - which means it's an event that belongs to a district. We can then print a string with the name of the event embedded in it by using "f-strings". `f'{event_name}'` simply embeds the `event_name` variable into the string.

But unfortunately our given event blobs don't include district points information. However, that information is available elsewhere in the API, so we need to make another call to the API. You'll note that the district points data is structured as such:

![enter image description here](https://i.imgur.com/WXFGops.png)

![enter image description here](https://i.imgur.com/fU6JkvI.png)

We're nearly there! Now we just need to calculate an average of the `'total'` field...

![enter image description here](https://i.imgur.com/sVKLqpl.png)


----------------

\<work in progress>