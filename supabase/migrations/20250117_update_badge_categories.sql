-- Update badge definitions and functions to use new category names
-- Hustle -> Career, Heart -> Spirit, Harmony -> Mindset, Happiness -> Joy

-- Step 1: Insert new badge definitions with updated names
INSERT INTO badge_definitions (id, name, description, icon, color, category, requirement_value, requirement_type, sort_order)
SELECT 'career_master', 'Career Master', 'Complete 50 career habits', icon, color, category, requirement_value, 'category_career', sort_order
FROM badge_definitions WHERE id = 'hustle_master'
ON CONFLICT (id) DO NOTHING;

INSERT INTO badge_definitions (id, name, description, icon, color, category, requirement_value, requirement_type, sort_order)
SELECT 'spirit_champion', 'Spirit Champion', 'Complete 50 spirit habits', icon, color, category, requirement_value, 'category_spirit', sort_order
FROM badge_definitions WHERE id = 'heart_champion'
ON CONFLICT (id) DO NOTHING;

INSERT INTO badge_definitions (id, name, description, icon, color, category, requirement_value, requirement_type, sort_order)
SELECT 'mindset_keeper', 'Mindset Keeper', 'Complete 50 mindset habits', icon, color, category, requirement_value, 'category_mindset', sort_order
FROM badge_definitions WHERE id = 'harmony_keeper'
ON CONFLICT (id) DO NOTHING;

INSERT INTO badge_definitions (id, name, description, icon, color, category, requirement_value, requirement_type, sort_order)
SELECT 'joy_guru', 'Joy Guru', 'Complete 50 joy habits', icon, color, category, requirement_value, 'category_joy', sort_order
FROM badge_definitions WHERE id = 'happiness_guru'
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update references in user_badges
UPDATE user_badges SET badge_id = 'career_master' WHERE badge_id = 'hustle_master';
UPDATE user_badges SET badge_id = 'spirit_champion' WHERE badge_id = 'heart_champion';
UPDATE user_badges SET badge_id = 'mindset_keeper' WHERE badge_id = 'harmony_keeper';
UPDATE user_badges SET badge_id = 'joy_guru' WHERE badge_id = 'happiness_guru';

-- Step 3: Update references in badge_progress
UPDATE badge_progress SET badge_id = 'career_master' WHERE badge_id = 'hustle_master';
UPDATE badge_progress SET badge_id = 'spirit_champion' WHERE badge_id = 'heart_champion';
UPDATE badge_progress SET badge_id = 'mindset_keeper' WHERE badge_id = 'harmony_keeper';
UPDATE badge_progress SET badge_id = 'joy_guru' WHERE badge_id = 'happiness_guru';

-- Step 4: Delete old badge definitions
DELETE FROM badge_definitions WHERE id IN ('hustle_master', 'heart_champion', 'harmony_keeper', 'happiness_guru');

-- Recreate the check_and_award_badges function with updated category names
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_count int;
  v_health_count int;
  v_career_count int;
  v_spirit_count int;
  v_mindset_count int;
  v_joy_count int;
  v_max_streak int;
  v_current_streak int;
  v_comeback_count int;
  v_perfect_week_count int;
  v_perfect_month_count int;
  v_follower_count int;
BEGIN
  -- Get total habit completions
  select count(*) into v_total_count
  from habit_completions hc
  where hc.user_id = p_user_id;

  -- Get category-specific counts
  select
    coalesce(sum(case when h.category = 'Health' then 1 else 0 end), 0) as health,
    coalesce(sum(case when h.category = 'Career' then 1 else 0 end), 0) as career,
    coalesce(sum(case when h.category = 'Spirit' then 1 else 0 end), 0) as spirit,
    coalesce(sum(case when h.category = 'Mindset' then 1 else 0 end), 0) as mindset,
    coalesce(sum(case when h.category = 'Joy' then 1 else 0 end), 0) as joy
  into v_health_count, v_career_count, v_spirit_count, v_mindset_count, v_joy_count
  from habit_completions hc
  join habits h on h.id = hc.habit_id
  where hc.user_id = p_user_id;

  -- Get streak information
  select
    coalesce(max(streak_length), 0),
    coalesce(
      (select count(*)
       from (
         select completed_date,
                completed_date - (row_number() over (order by completed_date))::int as grp
         from habit_completions
         where user_id = p_user_id
       ) sub
       group by grp
       order by count(*) desc
       limit 1
      ), 0)
  into v_max_streak, v_current_streak
  from (
    select count(*) as streak_length
    from (
      select completed_date,
             completed_date - (row_number() over (order by completed_date))::int as grp
      from habit_completions
      where user_id = p_user_id
    ) sub
    group by grp
  ) streaks;

  -- Update badge progress for quantity badges
  insert into badge_progress (user_id, badge_id, current_value)
  values
    (p_user_id, 'first_habit', v_total_count),
    (p_user_id, 'habit_builder', v_total_count),
    (p_user_id, 'consistency_king', v_total_count),
    (p_user_id, 'habit_legend', v_total_count),
    (p_user_id, 'health_hero', v_health_count),
    (p_user_id, 'career_master', v_career_count),
    (p_user_id, 'spirit_champion', v_spirit_count),
    (p_user_id, 'mindset_keeper', v_mindset_count),
    (p_user_id, 'joy_guru', v_joy_count)
  on conflict (user_id, badge_id)
  do update set
    current_value = excluded.current_value,
    updated_at = now();

  -- Award badges based on progress
  -- Quantity badges
  if v_total_count >= 1 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'first_habit')
    on conflict do nothing;
  end if;

  if v_total_count >= 50 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'habit_builder')
    on conflict do nothing;
  end if;

  if v_total_count >= 200 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'consistency_king')
    on conflict do nothing;
  end if;

  if v_total_count >= 500 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'habit_legend')
    on conflict do nothing;
  end if;

  -- Category mastery badges
  if v_health_count >= 50 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'health_hero')
    on conflict do nothing;
  end if;

  if v_career_count >= 50 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'career_master')
    on conflict do nothing;
  end if;

  if v_spirit_count >= 50 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'spirit_champion')
    on conflict do nothing;
  end if;

  if v_mindset_count >= 50 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'mindset_keeper')
    on conflict do nothing;
  end if;

  if v_joy_count >= 50 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'joy_guru')
    on conflict do nothing;
  end if;

  -- Five pillars master
  if v_health_count >= 25 and v_career_count >= 25 and v_spirit_count >= 25
     and v_mindset_count >= 25 and v_joy_count >= 25 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'five_pillars_master')
    on conflict do nothing;
  end if;

  -- Streak badges
  if v_max_streak >= 7 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'week_warrior')
    on conflict do nothing;
  end if;

  if v_max_streak >= 30 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'monthly_master')
    on conflict do nothing;
  end if;

  if v_max_streak >= 100 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'century_club')
    on conflict do nothing;
  end if;

  if v_max_streak >= 365 then
    insert into user_badges (user_id, badge_id)
    values (p_user_id, 'year_long_champion')
    on conflict do nothing;
  end if;
END;
$$;
