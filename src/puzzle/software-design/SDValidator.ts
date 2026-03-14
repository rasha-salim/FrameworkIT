import type {
  SoftwareDesignMetrics,
  SDPuzzleObjectives,
  ObjectiveCondition,
  Grade,
} from '../../types';

export class SDValidator {
  static evaluate(metrics: SoftwareDesignMetrics, objectives: SDPuzzleObjectives): Grade {
    const gold = SDValidator.checkConditions(metrics, objectives.gold);
    if (gold) return 'gold';

    const silver = SDValidator.checkConditions(metrics, objectives.silver);
    if (silver) return 'silver';

    const bronze = SDValidator.checkConditions(metrics, objectives.bronze);
    if (bronze) return 'bronze';

    return 'none';
  }

  static checkConditions(
    metrics: SoftwareDesignMetrics,
    conditions: ObjectiveCondition[]
  ): boolean {
    return conditions.every((cond) => {
      const value = SDValidator.getMetricValue(metrics, cond.metric);
      return SDValidator.check(value, cond.operator, cond.value);
    });
  }

  static getMetricValue(metrics: SoftwareDesignMetrics, metric: string): number {
    switch (metric) {
      case 'class_responsibility_score':
        return metrics.classResponsibilityScore;
      case 'coupling_index':
        return metrics.couplingIndex;
      case 'change_impact_radius':
        return metrics.changeImpactRadius;
      case 'interface_segregation_score':
        return metrics.interfaceSegregationScore;
      case 'dependency_direction':
        return metrics.dependencyDirection;
      case 'testability_score':
        return metrics.testabilityScore;
      default:
        return 0;
    }
  }

  static check(value: number, operator: string, target: number): boolean {
    switch (operator) {
      case '>=':
        return value >= target;
      case '<=':
        return value <= target;
      case '>':
        return value > target;
      case '<':
        return value < target;
      case '==':
        return value === target;
      default:
        return false;
    }
  }
}
