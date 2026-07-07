-- Pre-provision a pool of blank patient codes so check-in requires zero
-- digital action from a CA: print physical cards for each code below ahead
-- of time, keep them in a stack at reception, and hand the next card to
-- each new patient. The row already exists, so the kiosk "just works" the
-- first time that code is typed in — nobody has to create a patient record
-- at check-in.
--
-- 4-digit codes give 10,000 possible values, which comfortably outlasts a
-- 50+ patients/day practice for years without needing to recycle codes.
-- Run this once (or in batches as you print more cards), adjusting the
-- range so you don't re-insert codes you've already printed.

insert into patients (code, core_position)
select lpad(n::text, 4, '0'), 0
from generate_series(1, 500) as n
on conflict (code) do nothing;
