describe("Home page", () => {
  beforeEach(() => {
    cy.visit("localhost:3000");
  });

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
      cy.contains(title).click();
      cy.url().should("include", url);
      cy.get(".level-item > div > .title").should("have.text", title);
    });

    it(`${title} has a navbar that links home`, () => {
      cy.contains(title).click();
      cy.url().should("include", url);
      cy.get(".navbar-item").should("have.attr", "href", "/");
    });
  });

  [
    ["Motor Playground", "/motors"],
    ["Compressor Playground", "/compressors"],
    ["About ReCalc", "/about"],
  ].forEach(([title, url]) => {
    it(`Links to ${title}`, () => {
      cy.contains(title).click();
      cy.url().should("include", url);
    });
  });
});

export default {};
