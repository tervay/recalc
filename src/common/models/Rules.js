class Rule {
  constructor(conditionFn, modifyFn, haltAfter, priority) {
    this.conditionFn = conditionFn;
    this.modifyFn = modifyFn;
    this.haltAfter = haltAfter;
    this.priority = priority;
  }
}

export default class Rules {
  constructor() {
    this.rules = [];
  }

  addRule(conditionFn, modifyFn, haltAfter = false, priority = 0) {
    this.rules.push(new Rule(conditionFn, modifyFn, haltAfter, priority));
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  solve(source) {
    let runLoop = true;

    while (runLoop) {
      this.rules.forEach((rule) => {
        if (rule.conditionFn(source)) {
          rule.modifyFn(source);
        }
        if (rule.haltAfter) {
          runLoop = false;
          return;
        }
      });
    }
  }
}
