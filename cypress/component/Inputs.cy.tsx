import L0Boolean from "common/components/io/new/inputs/L0/L0Boolean";
import L0Number from "common/components/io/new/inputs/L0/L0Number";
import L0Select from "common/components/io/new/inputs/L0/L0Select";

import { L0NumberProps } from "common/components/io/new/inputs/types/Types";
import { StateHook } from "common/models/ExtraTypes";
import { mount } from "cypress/react";
import React from "react";

describe("L0 Inputs", () => {
  describe("Number", () => {
    it("Calls stateHook[1] with updated state", () => {
      const hook: StateHook<number> = [0, cy.spy()];
      mount(
        <L0Number
          stateHook={hook}
          id="ss"
          size={"small"}
          rounded={false}
          primaryIf={() => false}
          linkIf={() => false}
          infoIf={() => false}
          successIf={() => false}
          warningIf={() => false}
          dangerIf={() => false}
          disabledIf={() => false}
          static={false}
          readonly={false}
          delay={0}
          roundTo={0}
        />,
      ).then(() => {
        cy.get("input")
          .type("1")
          .then((_) => {
            expect(hook[1]).to.be.calledWith(1);
          });
      });
    });

    it("Is disabled when disabledIf is true", () => {
      const hook: StateHook<number> = [0, cy.spy()];
      mount(
        <L0Number
          stateHook={hook}
          id="ss"
          size={"small"}
          rounded={false}
          primaryIf={() => false}
          linkIf={() => false}
          infoIf={() => false}
          successIf={() => false}
          warningIf={() => false}
          dangerIf={() => false}
          disabledIf={() => true}
          static={false}
          readonly={false}
          delay={0}
          roundTo={0}
        />,
      ).then(() => {
        cy.get("input").then((div) => {
          expect(div).to.be.disabled;
        });
      });
    });

    it("Has the given ID", () => {
      const hook: StateHook<number> = [0, cy.spy()];
      mount(
        <L0Number
          stateHook={hook}
          id="ss"
          size={"small"}
          rounded={false}
          primaryIf={() => false}
          linkIf={() => false}
          infoIf={() => false}
          successIf={() => false}
          warningIf={() => false}
          dangerIf={() => false}
          disabledIf={() => false}
          static={false}
          readonly={false}
          delay={0}
          roundTo={0}
        />,
      ).then(() => {
        cy.get("input").then((div) => {
          expect(div).to.have.id("ss");
        });
      });
    });
    const makeProps: (
      stateHook: L0NumberProps["stateHook"],
    ) => L0NumberProps = (stateHook) => {
      return {
        stateHook: stateHook,
        id: "ss",
        size: "small",
        rounded: false,
        primaryIf: () => false,
        linkIf: () => false,
        infoIf: () => false,
        successIf: () => false,
        warningIf: () => false,
        dangerIf: () => false,
        disabledIf: () => false,
        static: false,
        readonly: false,
        delay: 0,
        roundTo: 0,
      };
    };

    [
      "dangerIf",
      "infoIf",
      "linkIf",
      "primaryIf",
      "successIf",
      "warningIf",
    ].forEach((name) => {
      const className = "is-" + name.replace("If", "");

      it(`[${name}] colors`, () => {
        const hook: StateHook<number> = [0, cy.spy()];
        mount(
          <L0Number {...makeProps(hook)} {...{ [name]: () => true }} />,
        ).then(() => {
          cy.get("input").then((div) => {
            expect(div).to.have.class(className);
          });
        });
      });
    });

    it("Does not update state with long delay", () => {
      const hook: StateHook<number> = [0, cy.spy()];
      mount(
        <L0Number
          stateHook={hook}
          id="ss"
          size={"small"}
          rounded={false}
          primaryIf={() => false}
          linkIf={() => false}
          infoIf={() => false}
          successIf={() => false}
          warningIf={() => false}
          dangerIf={() => false}
          disabledIf={() => false}
          static={false}
          readonly={false}
          delay={10000}
          roundTo={0}
        />,
      );

      cy.get("input")
        .type("1")
        .then((_) => {
          expect(hook[1]).to.not.be.called;
        });
    });
  });

  it("Updates state after short delay", () => {
    const hook: StateHook<number> = [0, cy.spy()];
    mount(
      <L0Number
        stateHook={hook}
        id="ss"
        size={"small"}
        rounded={false}
        primaryIf={() => false}
        linkIf={() => false}
        infoIf={() => false}
        successIf={() => false}
        warningIf={() => false}
        dangerIf={() => false}
        disabledIf={() => false}
        static={false}
        readonly={false}
        delay={1000}
        roundTo={0}
      />,
    ).then(() => {
      cy.get("input")
        .type("123")
        .wait(250)
        .then((_) => {
          expect(hook[1]).to.not.be.called;
        })
        .wait(1000)
        .then((_) => {
          expect(hook[1]).to.be.calledWith(123);
        });
    });
  });
});

describe("Boolean", () => {
  it("Should update state", () => {
    const hook: StateHook<boolean> = [false, cy.spy()];
    mount(<L0Boolean id="bool" stateHook={hook} />).then(() => {
      cy.get("input")
        .click()
        .then((div) => {
          expect(div).to.be.checked;
          expect(hook[1]).to.be.called;
        });
    });
  });

  it("Should have the given ID", () => {
    const hook: StateHook<boolean> = [false, cy.spy()];
    mount(<L0Boolean id="bool" stateHook={hook} />).then(() => {
      cy.get("input").then((div) => {
        expect(div).to.have.id("bool");
      });
    });
  });
});

describe("Select", () => {
  it("Has options from choices", () => {
    const hook: StateHook<string> = ["Foo", cy.spy()];
    mount(
      <L0Select
        id={"select"}
        stateHook={hook}
        size={"small"}
        loadingIf={() => false}
        rounded={false}
        primaryIf={() => false}
        linkIf={() => false}
        infoIf={() => false}
        successIf={() => false}
        warningIf={() => false}
        dangerIf={() => false}
        choices={["Foo", "Bar", "Baz"]}
      />,
    ).then(() => {
      cy.get("option").should("have.length", 3);
    });
  });

  it("Should update state", () => {
    const hook: StateHook<string> = ["Foo", cy.spy()];
    mount(
      <L0Select
        id={"select"}
        stateHook={hook}
        size={"small"}
        loadingIf={() => false}
        rounded={false}
        primaryIf={() => false}
        linkIf={() => false}
        infoIf={() => false}
        successIf={() => false}
        warningIf={() => false}
        dangerIf={() => false}
        choices={["Foo", "Bar", "Baz"]}
      />,
    ).then(() => {
      cy.get("select")
        .select("Bar")
        .then((_) => {
          expect(hook[1]).to.have.been.calledWith("Bar");
        });
    });
  });
});
