import random
import sys

from jinja2 import Environment, FileSystemLoader, select_autoescape
from rich.prompt import Prompt
from yaml import Loader, load

env = Environment(
    loader=FileSystemLoader("scripts/py/"), autoescape=select_autoescape()
)


def ui(config, calculator_name, endpoint):
    cases = []
    for input_name, input_config in config["inputs"].items():
        change_val = random.randint(input_config["min"], input_config["max"])
        while change_val in input_config["exclude"]:
            change_val = random.randint(input_config["min"], input_config["max"])

        output_testcase = [
            {"change": {"key": input_name, "value": str(change_val)}},
            {},
        ]

        for other_field_name in list(config["inputs"].keys()) + list(
            config["outputs"].keys()
        ):
            if other_field_name == input_name:
                continue

            test_val = -1
            if (
                other_field_name in config["inputs"]
                and len(config["inputs"][other_field_name]["exclude"]) > 0
            ):
                test_val = config["inputs"][other_field_name]["exclude"][0]

            output_testcase[1][other_field_name] = test_val

        cases.append(output_testcase)

    print(
        env.get_template("test_template.jinja2").render(
            {
                "inputs": config["inputs"],
                "input_selects": {
                    k: v
                    for k, v in config["inputs"].items()
                    if "select" in v and v["select"]
                },
                "outputs": config["outputs"],
                "output_selects": {
                    k: v
                    for k, v in config["outputs"].items()
                    if "select" in v and v["select"]
                },
                "calculator_name": calculator_name,
                "endpoint": endpoint,
                "cases": cases,
            }
        )
    )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python gen_test.py testcases.json")
        exit(0)

    fname = sys.argv[1]
    with open(fname, "r") as f:
        config = load(f, Loader)

    calculator_name = Prompt.ask("Calculator name?")
    endpoint = Prompt.ask("Endpoint?")

    ui(config, calculator_name, endpoint)
