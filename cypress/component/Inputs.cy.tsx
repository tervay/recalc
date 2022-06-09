import L0Number from "common/components/io/new/inputs/L0/L0Number";
import { mount, mountHook } from "cypress/react";
import React, { useState } from "react";

describe("L0 Inputs", () => {
  describe("Number input", () => {
    it("Number Input", () => {
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
  });
});
