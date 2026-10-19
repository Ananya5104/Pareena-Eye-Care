import { Link } from 'react-router-dom'
import { ProductImage, Swatch } from './ui'
import { inr } from '../data/catalog'

export default function ProductCard({ product }) {
  return (
    <Link to={`/shop/${product.id}`} className="grid gap-2.5 text-ink no-underline hover:text-ink">
      <ProductImage src={product.image} alt={product.name} ratio="aspect-square md:aspect-[4/3]" />
      <div className="grid gap-1">
        <div className="flex justify-between gap-2">
          <span className="label text-xs md:text-[13px]">{product.brand}</span>
          <span className="num hidden text-sm text-muted md:inline">{product.size}</span>
        </div>
        <span className="text-[15px] font-semibold leading-5 md:text-[17px] md:leading-6">{product.name}</span>
        <div className="flex items-center justify-between gap-2">
          <span className="num font-semibold">{inr(product.price)}</span>
          <span className="inline-flex gap-1.5">
            {product.colours.slice(0, 3).map((c) => <Swatch key={c.name} hex={c.hex} />)}
          </span>
        </div>
      </div>
    </Link>
  )
}
