describe("Home page", () => {
  [
    ["Belt Calculator", "/belts"],
    ["Chain Calculator", "/chains"],
    ["Pneumatics Calculator", "/pneumatics"],
    ["Flywheel Calculator", "/flywheel"],
    ["Arm Calculator", "/arm"],
    ["Linear Mechanism Calculator", "/linear"],
    ["Intake Calculator", "/intake"],
  ].forEach(([title, url]) => {
    it(`Links to ${title}`, () => {
      cy.visit("localhost:3000");
      cy.contains(title).click();
      cy.url().should("include", url);
      cy.get(".level-item > div > .title").should("have.text", title);
    });

    it(`${title} has a navbar that links home`, () => {
      cy.visit("localhost:3000");
      cy.contains(title).click();
      cy.url().should("include", url);
      cy.get(".navbar-item").should("have.attr", "href", "/");
    });
  });
});

export default {};
