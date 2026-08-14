# The Token Index

A usage-weighted price of the tokens the world actually spends, built from [OpenRouter](https://openrouter.ai/rankings) rankings and live model prices. A sister Compute Index (GPI) is the median firm H100 rental across GPU clouds, from [GPU Rental Prices](https://gpurentalprices.com).

Index **100** on TPI equals **$1.00 per million tokens**. Index **100** on GPI equals **$1.00 per GPU-hour**. Headline TPI is paid text traffic only. GPI is on-demand and secure quotes only, one cheapest H100 per cloud, then the median.

## Formula

```
TPI = 100 × Σ (tokensᵢ × priceᵢ) / Σ tokensᵢ
GPI = 100 × median(firm H100ᵢ)
```

`priceᵢ` is each model's own mix: prompt tokens at the prompt rate, completion tokens at the completion rate. Models are weighted by tokens consumed, not equally. House indexes cut the same formula to one lab. Batch variants keep their discounted sticker.

## Develop

```bash
npm install
npm test
npm run dev
```

JSON is at `/api/index`. Rankings, prices, and GPU quotes are cached for about an hour.

## Attribution

Token mix: OpenRouter (openrouter.ai/rankings). GPU stickers: GPU Rental Prices (gpurentalprices.com), CC BY 4.0. Not affiliated with either.
