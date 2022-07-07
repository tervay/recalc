import L0Boolean from "common/components/io/new/inputs/L0/L0Boolean";
import L0Number from "common/components/io/new/inputs/L0/L0Number";
import L0Select from "common/components/io/new/inputs/L0/L0Select";

import { L0NumberProps } from "common/components/io/new/inputs/types/Types";
import { mount, mountHook } from "cypress/react";
import React, { useState } from "react";

describe("L0 Inputs", () => {
  describe("Number", () => {
    it("Calls stateHook[1] with updated state", () => {
      mountHook(() => useState(0)).then((hook) => {
        const spy = cy.spy(hook.current![1]);
        mount(
          <L0Number
            stateHook={[hook.current![0], spy]}
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
          />
        );

        cy.get("input")
          .type("1")
          .then((_) => {
            expect(spy).to.be.calledWith(1);
          });
      });
    });

    it("Is disabled when disabledIf is true", () => {
      mountHook(() => useState(0)).then((hook) => {
        mount(
          <L0Number
            stateHook={hook.current!}
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
          />
        );

        cy.get("input").then((div) => {
          expect(div).to.be.disabled;
        });
      });
    });

    it("Has the given ID", () => {
      mountHook(() => useState(0)).then((hook) => {
        mount(
          <L0Number
            stateHook={hook.current!}
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
          />
        );

        cy.get("input").then((div) => {
          expect(div).to.have.id("ss");
        });
      });
    });

    const makeProps: (
      stateHook: L0NumberProps["stateHook"]
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
        mountHook(() => useState(0)).then((hook) => {
          mount(
            <L0Number
              {...makeProps(hook.current!)}
              {...{ [name]: () => true }}
            />
          );

          cy.get("input").then((div) => {
            expect(div).to.have.class(className);
          });
        });
      });
    });

    it("Does not update state with long delay", () => {
      mountHook(() => useState(0)).then((hook) => {
        const spy = cy.spy(hook.current![1]);
        mount(
          <L0Number
            stateHook={[hook.current![0], spy]}
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
          />
        );

        cy.get("input")
          .type("1")
          .then((_) => {
            expect(spy).to.not.be.called;
          });
      });
    });

    it("Updates state after short delay", () => {
      mountHook(() => useState(0)).then((hook) => {
        const spy = cy.spy(hook.current![1]);
        mount(
          <L0Number
            stateHook={[hook.current![0], spy]}
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
          />
        );

        cy.get("input")
          .type("123")
          .wait(250)
          .then((_) => {
            expect(spy).to.not.be.called;
          })
          .wait(1000)
          .then((_) => {
            expect(spy).to.be.calledWith(123);
          });
      });
    });
  });

  describe("Boolean", () => {
    it("Should update state", () => {
      mountHook(() => useState(false)).then((hook) => {
        const spy = cy.spy(hook.current![1]);
        mount(<L0Boolean id="bool" stateHook={[hook.current![0], spy]} />);

        cy.get("input")
          .click()
          .then((div) => {
            expect(div).to.be.checked;
            expect(spy).to.be.called;
          });
      });
    });

    it("Should have the given ID", () => {
      mountHook(() => useState(false)).then((hook) => {
        mount(<L0Boolean id="bool" stateHook={hook.current!} />);

        cy.get("input").then((div) => {
          expect(div).to.have.id("bool");
        });
      });
    });
  });

  describe("Select", () => {
    it("Has options from choices", () => {
      mountHook(() => useState("Foo")).then((hook) => {
        mount(
          <L0Select
            id={"select"}
            stateHook={hook.current!}
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
          />
        );

        cy.get("option").should("have.length", 3);
      });
    });
    it("Should update state", () => {
      mountHook(() => useState("Foo")).then((hook) => {
        const spy = cy.spy(hook.current![1]);
        mount(
          <L0Select
            id={"select"}
            stateHook={[hook.current![0], spy]}
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
          />
        );

        cy.get("select")
          .select("Bar")
          .then((_) => {
            expect(spy).to.have.been.calledWith("Bar");
          });
      });
    });
  });
});
