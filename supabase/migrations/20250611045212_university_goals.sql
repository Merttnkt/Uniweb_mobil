-- Create the university_goals table
CREATE TABLE public.university_goals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    uni text NOT NULL,
    bolum text NOT NULL,
    taban real NOT NULL,
    son_siralama integer NOT NULL,
    sinav_tarih date NOT NULL,
    notlar text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT university_goals_pkey PRIMARY KEY (id),
    CONSTRAINT university_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create the goal_net_targets table
CREATE TABLE public.goal_net_targets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    goal_id uuid NOT NULL,
    subject text NOT NULL,
    target_net real NOT NULL,
    CONSTRAINT goal_net_targets_pkey PRIMARY KEY (id),
    CONSTRAINT goal_net_targets_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.university_goals(id) ON DELETE CASCADE
);

-- RLS Policies for university_goals
ALTER TABLE public.university_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own goals" ON public.university_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own goals" ON public.university_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own goals" ON public.university_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own goals" ON public.university_goals
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for goal_net_targets
ALTER TABLE public.goal_net_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own goal net targets" ON public.goal_net_targets
    FOR SELECT USING ( (SELECT user_id FROM public.university_goals WHERE id = goal_id) = auth.uid() );

CREATE POLICY "Allow users to insert their own goal net targets" ON public.goal_net_targets
    FOR INSERT WITH CHECK ( (SELECT user_id FROM public.university_goals WHERE id = goal_id) = auth.uid() );

CREATE POLICY "Allow users to update their own goal net targets" ON public.goal_net_targets
    FOR UPDATE USING ( (SELECT user_id FROM public.university_goals WHERE id = goal_id) = auth.uid() );

CREATE POLICY "Allow users to delete their own goal net targets" ON public.goal_net_targets
    FOR DELETE USING ( (SELECT user_id FROM public.university_goals WHERE id = goal_id) = auth.uid() );
