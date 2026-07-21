export interface MortgageInput {
  principal: number;
  annualRatePercent: number;
  termYears: number;
  downPayment?: number;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}

export interface MortgageResult {
  loanAmount: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: AmortizationRow[];
}

export function calculateMortgage({ principal, annualRatePercent, termYears, downPayment = 0 }: MortgageInput): MortgageResult {
  const loanAmount = Math.max(principal - downPayment, 0);
  const monthlyRate = annualRatePercent / 100 / 12;
  const numPayments = termYears * 12;

  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / numPayments
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

  const schedule: AmortizationRow[] = [];
  let balance = loanAmount;

  for (let month = 1; month <= numPayments; month += 1) {
    const interestPaid = balance * monthlyRate;
    const principalPaid = monthlyPayment - interestPaid;
    balance = Math.max(balance - principalPaid, 0);
    schedule.push({ month, payment: monthlyPayment, principalPaid, interestPaid, balance });
  }

  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - loanAmount;

  return {
    loanAmount,
    monthlyPayment: Number.isFinite(monthlyPayment) ? monthlyPayment : 0,
    totalPayment: Number.isFinite(totalPayment) ? totalPayment : 0,
    totalInterest: Number.isFinite(totalInterest) ? totalInterest : 0,
    schedule,
  };
}
