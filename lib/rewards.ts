import type { Prisma, RewardFrequencyPeriod } from "@prisma/client";

type RewardTx = Prisma.TransactionClient;

export type AwardRewardTaskInput = {
  userId: string;
  taskKey: string;
  rewardYear?: number;
  eventId?: string | null;
  completedAt?: Date;
  description?: string | null;
};

export type AwardRewardTaskResult = {
  awarded: boolean;
  taskKey: string;
  points: number;
  reason?: string;
  completionId?: string;
  rewardAccountId?: string;
};

type RewardTaskRecord = {
  task_id: string;
  task_key: string;
  name: string;
  points: number;
  frequency_period: RewardFrequencyPeriod;
  frequency_limit: number | null;
  active: boolean;
};

function startOfWeek(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return date;
}

function getPeriodBounds(period: RewardFrequencyPeriod, completedAt: Date) {
  const current = new Date(completedAt);

  if (period === "month") {
    const start = new Date(current.getFullYear(), current.getMonth(), 1);
    const end = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    return { start, end };
  }

  if (period === "week") {
    const start = startOfWeek(current);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  if (period === "year") {
    const start = new Date(current.getFullYear(), 0, 1);
    const end = new Date(current.getFullYear() + 1, 0, 1);
    return { start, end };
  }

  return null;
}

export async function awardRewardTask(
  tx: RewardTx,
  input: AwardRewardTaskInput
): Promise<AwardRewardTaskResult> {
  const rewardYear = input.rewardYear ?? new Date().getFullYear();
  const completedAt = input.completedAt ?? new Date();

  const task = await tx.reward_tasks.findUnique({
    where: { task_key: input.taskKey },
    select: {
      task_id: true,
      task_key: true,
      name: true,
      points: true,
      frequency_period: true,
      frequency_limit: true,
      active: true,
    },
  });

  if (!task || !task.active) {
    return {
      awarded: false,
      taskKey: input.taskKey,
      points: 0,
      reason: "Reward task not found or inactive",
    };
  }

  const completionWhere: Prisma.reward_task_completionsWhereInput = {
    user_id: input.userId,
    task_id: task.task_id,
  };

  if (task.frequency_period === "event") {
    if (!input.eventId) {
      return {
        awarded: false,
        taskKey: task.task_key,
        points: task.points,
        reason: "eventId is required for event-based reward tasks",
      };
    }

    completionWhere.event_id = input.eventId;
  } else if (task.frequency_period === "year") {
    completionWhere.reward_year = rewardYear;
  } else if (task.frequency_period === "month" || task.frequency_period === "week") {
    const bounds = getPeriodBounds(task.frequency_period, completedAt);
    if (bounds) {
      completionWhere.completed_at = {
        gte: bounds.start,
        lt: bounds.end,
      };
    }
  }

  if (task.frequency_limit !== null) {
    const existingCount = await tx.reward_task_completions.count({
      where: completionWhere,
    });

    if (existingCount >= task.frequency_limit) {
      return {
        awarded: false,
        taskKey: task.task_key,
        points: task.points,
        reason: "Reward task limit reached",
      };
    }
  }

  const rewardAccount = await tx.reward_accounts.upsert({
    where: {
      user_id_reward_year: {
        user_id: input.userId,
        reward_year: rewardYear,
      },
    },
    update: {},
    create: {
      user_id: input.userId,
      reward_year: rewardYear,
    },
    select: {
      reward_account_id: true,
    },
  });

  const completion = await tx.reward_task_completions.create({
    data: {
      user_id: input.userId,
      task_id: task.task_id,
      reward_year: rewardYear,
      event_id: input.eventId ?? null,
      points_awarded: task.points,
      completed_at: completedAt,
    },
    select: {
      completion_id: true,
    },
  });

  await tx.reward_point_transactions.create({
    data: {
      user_id: input.userId,
      reward_account_id: rewardAccount.reward_account_id,
      task_id: task.task_id,
      completion_id: completion.completion_id,
      transaction_type: "task_completion",
      points: task.points,
      description: input.description ?? task.name,
    },
  });

  await tx.reward_accounts.update({
    where: {
      reward_account_id: rewardAccount.reward_account_id,
    },
    data: {
      points_balance: {
        increment: task.points,
      },
      points_earned: {
        increment: task.points,
      },
    },
  });

  return {
    awarded: true,
    taskKey: task.task_key,
    points: task.points,
    completionId: completion.completion_id,
    rewardAccountId: rewardAccount.reward_account_id,
  };
}
