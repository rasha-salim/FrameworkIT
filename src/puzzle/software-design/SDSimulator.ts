import { useSDPuzzleStore, type ScenarioResult } from './SDPuzzleStore';
import { SDValidator } from './SDValidator';
import type {
  SDClass,
  SDInterface,
  SDDependency,
  ChangeScenario,
  SoftwareDesignMetrics,
  SDPuzzleData,
} from '../../types';
import { useGameStore } from '../../core/GameStore';

export class SDSimulator {
  static async run(): Promise<void> {
    const store = useSDPuzzleStore.getState();
    const { puzzleData, classes, interfaces, dependencies } = store;
    if (!puzzleData) return;

    store.startSimulation();

    // Simulate async delay for visual feedback
    await new Promise((r) => setTimeout(r, 600));

    const results = puzzleData.changeScenarios.map((scenario) =>
      SDSimulator.runScenario(scenario, classes, interfaces, dependencies)
    );

    const metrics = SDSimulator.computeMetrics(
      classes,
      interfaces,
      dependencies,
      results,
      puzzleData
    );

    const grade = SDValidator.evaluate(metrics, puzzleData.objectives);

    store.completeSimulation(results, metrics, grade);

    // Transition to results phase
    await new Promise((r) => setTimeout(r, 300));
    useGameStore.getState().setPhase('results');
  }

  static runScenario(
    scenario: ChangeScenario,
    classes: SDClass[],
    _interfaces: SDInterface[],
    dependencies: SDDependency[]
  ): ScenarioResult {
    // Find classes whose methods belong to the affected responsibility groups
    const directlyAffected = classes.filter((cls) =>
      cls.methods.some((m) =>
        scenario.affectedMethodGroups.includes(m.responsibilityGroup || '')
      )
    );

    const directIds = new Set(directlyAffected.map((c) => c.id));

    // Find transitively affected via dependencies (classes that depend on affected classes)
    const allAffected = new Set(directIds);
    let changed = true;
    while (changed) {
      changed = false;
      for (const dep of dependencies) {
        if (dep.type === 'implements') continue; // implementation deps don't propagate changes up
        if (allAffected.has(dep.target) && !allAffected.has(dep.source)) {
          // Only propagate if the dependency is concrete-to-concrete (not through an interface)
          const targetIsInterface = !classes.find((c) => c.id === dep.target);
          if (!targetIsInterface) {
            allAffected.add(dep.source);
            changed = true;
          }
        }
      }
    }

    return {
      scenarioId: scenario.id,
      description: scenario.description,
      classesAffected: Array.from(allAffected),
      changeCount: allAffected.size,
    };
  }

  static computeMetrics(
    classes: SDClass[],
    interfaces: SDInterface[],
    dependencies: SDDependency[],
    results: ScenarioResult[],
    puzzleData: SDPuzzleData
  ): SoftwareDesignMetrics {
    // --- classResponsibilityScore ---
    // Check how well each class has a single responsibility group
    let totalResponsibilityScore = 0;
    for (const cls of classes) {
      const groups = new Set(cls.methods.map((m) => m.responsibilityGroup || 'unknown'));
      // Perfect = 1 group, penalize for each additional group
      const score = groups.size > 0 ? Math.max(0, 100 - (groups.size - 1) * 30) : 0;
      totalResponsibilityScore += score;
    }
    const classResponsibilityScore = classes.length > 0
      ? totalResponsibilityScore / classes.length
      : 0;

    // --- couplingIndex ---
    // Count concrete-to-concrete dependencies (not through interfaces)
    const interfaceIds = new Set(interfaces.map((i) => i.id));
    const concreteDeps = dependencies.filter(
      (d) => d.type === 'depends-on' && !interfaceIds.has(d.target)
    );
    const couplingIndex = concreteDeps.length;

    // --- changeImpactRadius ---
    const totalImpact = results.reduce((sum, r) => sum + r.changeCount, 0);
    const changeImpactRadius = results.length > 0 ? totalImpact / results.length : 0;

    // --- interfaceSegregationScore ---
    // Check if any class depends on methods it doesn't use
    let segregationViolations = 0;
    let totalInterfaceDeps = 0;
    for (const dep of dependencies) {
      if (dep.type !== 'depends-on') continue;
      const targetIface = interfaces.find((i) => i.id === dep.target);
      if (!targetIface) continue;
      totalInterfaceDeps++;

      const sourceClass = classes.find((c) => c.id === dep.source);
      if (!sourceClass) continue;

      // A simple heuristic: if the interface has more than 5 methods, it might be too fat
      if (targetIface.methods.length > 5) {
        segregationViolations++;
      }
    }
    const interfaceSegregationScore = totalInterfaceDeps > 0
      ? Math.round(((totalInterfaceDeps - segregationViolations) / totalInterfaceDeps) * 100)
      : 100;

    // --- dependencyDirection ---
    // Percentage of dependencies pointing toward abstractions (interfaces)
    const allDepOnDeps = dependencies.filter((d) => d.type === 'depends-on');
    const towardAbstraction = allDepOnDeps.filter((d) => interfaceIds.has(d.target));
    const dependencyDirection = allDepOnDeps.length > 0
      ? Math.round((towardAbstraction.length / allDepOnDeps.length) * 100)
      : 0;

    // --- testabilityScore ---
    // Classes that implement interfaces or have all deps through interfaces are testable
    let testableClasses = 0;
    for (const cls of classes) {
      const clsDeps = dependencies.filter(
        (d) => d.source === cls.id && d.type === 'depends-on'
      );
      const allDepsAbstract = clsDeps.every((d) => interfaceIds.has(d.target));
      if (allDepsAbstract || clsDeps.length === 0) {
        testableClasses++;
      }
    }
    const testabilityScore = classes.length > 0
      ? Math.round((testableClasses / classes.length) * 100)
      : 0;

    return {
      classResponsibilityScore: Math.round(classResponsibilityScore),
      couplingIndex,
      changeImpactRadius: Math.round(changeImpactRadius * 10) / 10,
      interfaceSegregationScore,
      dependencyDirection,
      testabilityScore,
    };
  }
}
