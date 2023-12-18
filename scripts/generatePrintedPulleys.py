import json


with open("src/common/models/data/cots/printedPulleys.json", "w") as f:
    out = []

    for bore in [
        "NEO",
        "Kraken",
        "Falcon",
        "775",
        "550",
        "1/2 Hex",
        "3/8 Hex",
        "0.875in",
        "1.125in",
        "MAXSpline",
        "SplineXL",
    ]:
        for pitch in [
            (3, "mm", "GT2"),
            (5, "mm", "HTD"),
            (0.25, "in", "RT25"),
        ]:
            for t in range(6, 84):
                out.append(
                    {
                        "bore": bore,
                        "partNumber": f'{t}T_{bore.replace(" ", "-")}',
                        "pitch": {
                            "s": pitch[0],
                            "u": pitch[1],
                        },
                        "teeth": t,
                        "type": pitch[2],
                        "vendor": "Printed",
                        "width": {"s": 15, "u": "mm"},
                        "url": "#",
                    }
                )

    json.dump(out, fp=f)
