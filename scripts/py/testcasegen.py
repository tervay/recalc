import json
import random
import sys


def dict_to_ts(d: dict):
    s = "{\n"
    for k, v in d.items():
        s += f"  {k}: {v},\n"
    s += "}"
    return s


def ui(config):
    cases = []
    for mod_name, mod_config in config["inputs"].items():
        case = [{}, {}]

        val = random.randint(mod_config["min"], mod_config["max"])
        while val in mod_config["exclude"]:
            val = random.randint(mod_config["min"], mod_config["max"])

        case[0]["change"] = {
            "key": mod_name,
            "value": str(val),
        }
        for unmodified_case in list(config["inputs"].keys()) + list(config["outputs"]):
            if unmodified_case == mod_name:
                continue

            val = -1
            if (
                unmodified_case in config["inputs"]
                and len(config["inputs"][unmodified_case]["exclude"]) > 0
            ):
                val = config["inputs"][unmodified_case]["exclude"][0]

            case[1][unmodified_case] = val

        cases.append(case)

    inputs = {k: f'() => screen.getByTestId("{k}")' for k in config["inputs"].keys()}
    outputs = {k: f'() => screen.getByTestId("{k}")' for k in config["outputs"]}

    print("\n")
    print(f"const inputs = {dict_to_ts(inputs)};")
    print(f"const outputs = {dict_to_ts(outputs)};")
    print("\n")
    for case in cases:
        print("[", dict_to_ts(case[0]), ",", dict_to_ts(case[1]), "],")


def math(config):
    pass


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ["ui", "math"]:
        print("Usage: python testcasegen.py [ui|math] testcases.json")
        exit(0)

    fname = sys.argv[2]
    with open(fname, "r") as f:
        config = json.load(f)

    mode = sys.argv[1]
    if mode == "ui":
        ui(config)
    else:
        math(config)
