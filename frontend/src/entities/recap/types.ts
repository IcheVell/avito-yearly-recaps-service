export type MetricVariant = 'red' | 'blue' | 'green' | 'purple';
;

export type Metric = {
    id: number;
    title: string;
    value: string;
    text: string;
    variant: MetricVariant;
}

export type Recap = {
    year: number;
    metrics: Metric[];
}