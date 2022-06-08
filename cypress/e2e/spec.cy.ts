describe("My First Test", () => {
  it("Visits the Kitchen Sink", () => {
    cy.visit("localhost:3000");
    cy.contains("Belt Calculator").click();
    cy.url().should("include", "/belts");
    cy.get('[data-testid="pitch"]').type("4").should("have.value", "34");
  });
});

export default {};
