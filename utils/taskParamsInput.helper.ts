import moment, { unitOfTime } from "moment";

const isDuration = (value: string): value is unitOfTime.DurationConstructor =>
  [
    "year",
    "years",
    "y",
    "month",
    "months",
    "M",
    "week",
    "weeks",
    "w",
    "day",
    "days",
    "d",
    "hour",
    "hours",
    "h",
    "minute",
    "minutes",
    "m",
    "second",
    "seconds",
    "s",
    "millisecond",
    "milliseconds",
    "ms",
  ].includes(value as unitOfTime.DurationConstructor);

export const parseTimeInput = (time: string): { seconds: number; human: string } => {
  const parsedNumber = time.match(/-?[0-9]+/g);
  const num = parsedNumber ? parsedNumber[0] : "0";
  const unit = time.slice(num.length);
  if (!isDuration(unit)) throw new Error("Wrong time unit");
  const seconds = moment.duration(num, unit).asSeconds();
  const human = moment.duration(num, unit).humanize();
  return { seconds, human };
};
