# The Token Index

A usage-weighted price of the tokens the world actually spends, built from [OpenRouter](https://openrouter.ai/rankings) rankings and live model prices.

Index **100** equals **$1.00 per million tokens**. The headline TPI is paid text traffic only. Free endpoints are shown separately so a wall of $0 rows cannot flatten the meter.

## Formula

```
TPI = 100 × Σ (tokensᵢ × priceᵢ) / Σ tokensᵢ
```

`priceᵢ` is each model’s own mix: prompt tokens at the prompt rate, completion tokens at the completion rate. Models are weighted by tokens consumed, not equally. Batch variants keep their discounted sticker.

## Develop

```bash
npm install
npm test
npm run dev
```

JSON is at `/api/index`. Rankings and prices are cached for about an hour.

## Attribution

Source: OpenRouter (openrouter.ai/rankings). Not affiliated with OpenRouter.
