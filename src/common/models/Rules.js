class Rule {
  constructor(name, conditionFn, modifyFn, haltAfter, priority) {
    this.name = name;
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

  addRule(name, conditionFn, modifyFn, haltAfter = false, priority = 0) {
    this.rules.push(new Rule(name, conditionFn, modifyFn, haltAfter, priority));
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  solve(source, iterationLimit = 100) {
    let runLoop = true;
    let i = 0;

    while (runLoop && i <= iterationLimit) {
      let runForEach = true;
      // console.log('-----');
      this.rules.forEach((rule) => {
        if (!runForEach) {
          return;
        }
        // console.log('Checking ' + rule.name + ' (' + rule.priority + ')')
        if (rule.conditionFn(source)) {
          // console.log('Running ' + rule.name);
          rule.modifyFn(source);

          if (rule.haltAfter) {
            runLoop = false;
          }
          runForEach = false;
        }
      });
      i++;
    }
  }
}
