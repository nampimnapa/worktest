'use client';

import { useEffect, useState } from 'react';
import { getProducts, getDiscount } from '../api/query/route';
import { Card, CardBody, CardFooter, Image, Button, Select, SelectItem } from "@heroui/react";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function App() {

  const [products, setProducts] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [discount, setDiscount] = useState<any[]>([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [pointsUsed, setPointsUsed] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const data = await getProducts();
      setProducts(data);
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchDiscount() {
      const discount = await getDiscount();
      setDiscount(discount);
    }
    fetchDiscount();
    console.log(discount)
  }, []);

  const addToCart = (product: any) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.product_id);
      if (existing) {
        // เพิ่มจำนวนสินค้า
        return prev.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.product_id !== productId));
  };



  // ยอดรวม ไม่สุทธิ
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 20% ของยอดรวม
  const maxPoints = totalPrice * 0.2;




  // รวมส่วนลดที่เป็น category discount
  const categoryDiscounts = discount.filter(
    (d) => selectedKeys.has(String(d.campaign_id)) && d.category === "percent_category"

  );

  // รวมส่วนลด fixed ที่เลือก
  const fixedDiscounts = discount.filter(
    (d) => selectedKeys.has(String(d.campaign_id)) && d.category === "fixed"
  );

  // รวมส่วนลด percent ที่เลือก
  const percentDiscounts = discount.filter(
    (d) => selectedKeys.has(String(d.campaign_id)) && d.category === "percent"
  );

const specialDiscounts = discount.filter(
  (d) => selectedKeys.has(String(d.campaign_id)) && d.category === "special"
);

  // รวมส่วนลด fixed ทั้งหมด
  const totalFixedDiscount = fixedDiscounts.reduce(
    (sum, d) => sum + (d.amount ?? 0),
    0
  );
const totalSpecialDiscount = specialDiscounts.reduce((sum, d) => {
  const everyX = d.every_x ?? 0;
  const discountY = d.discount_y ?? 0;

  if (everyX > 0 && discountY > 0) {
    const steps = Math.floor(totalPrice / everyX);
    return sum + steps * discountY;
  }

  return sum;
}, 0);


  // รวมส่วนลด percent 
  const totalPercent = percentDiscounts
    .filter(d => !d.category_name)
    .reduce((sum, d) => sum + (d.percent ?? 0), 0);

  const calculateCategoryDiscount = (disc) => {
    const categoryItems = cartItems.filter(
      item => item.category_name?.toLowerCase() === disc.product_category?.toLowerCase()
    );

    const categoryTotal = categoryItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );


    if (disc.category === "fixed") {
      return Math.min(disc.amount ?? 0, categoryTotal);
    } else if (disc.category === "percent" || disc.category === "percent_category") {
      return categoryTotal * ((disc.percent ?? 0) / 100);
    }

    return 0;
  };

  // รวมส่วนลด seasonal step
  const seasonalStepDiscounts = discount.filter(
    (d) => selectedKeys.has(String(d.campaign_id)) && d.category === "step"
  );

  const totalSeasonalStepDiscount = seasonalStepDiscounts.reduce((sum, d) => {
    const everyX = d.every_x ?? 0;
    const discountY = d.discount_y ?? 0;

    if (everyX > 0 && discountY > 0) {
      const steps = Math.floor(totalPrice / everyX);
      return sum + steps * discountY;
    }

    return sum;
  }, 0);



  // รวมส่วนลด category discount
  const totalCategoryDiscount = categoryDiscounts.reduce(
    (sum, d) => sum + calculateCategoryDiscount(d),
    0
  );


  const totalPercentDiscount = (totalPrice - totalFixedDiscount) * (totalPercent / 100);

  const totalDiscount = totalFixedDiscount + totalPercentDiscount + totalCategoryDiscount + pointsUsed + totalSeasonalStepDiscount +   totalSpecialDiscount +
;

  // ราคาหลังหักส่วนลด
  const finalPrice = totalPrice - totalDiscount;


  // find category point
  const pointsDiscountSelected = discount.find(
    (d) => selectedKeys.has(String(d.campaign_id)) && d.category === "point"
  );

  const handleSelectionChange = (newSelectedKeys: Set<string>) => {
    const selectedDiscounts = discount.filter(d =>
      newSelectedKeys.has(String(d.campaign_id))
    );

    const hasPointCampaign = selectedDiscounts.some(d => d.category === "point");

    if (hasPointCampaign) {
      const hasOtherCampaigns = selectedDiscounts.some(d => d.category !== "point");
      if (hasOtherCampaigns) {
        alert("ไม่สามารถใช้แคมเปญแต้มร่วมกับแคมเปญประเภทอื่นได้");
        return; 
      }
    }

    const typeToSelectedKey = new Map<string, string>();

    for (const disc of selectedDiscounts) {
      if (!typeToSelectedKey.has(disc.campaign_type)) {
        typeToSelectedKey.set(disc.campaign_type, String(disc.campaign_id));
      }
    }

    const filteredKeys = new Set<string>(Array.from(typeToSelectedKey.values()));

    setSelectedKeys(filteredKeys);
    console.log("Selected Category Discounts", categoryDiscounts);
    categoryDiscounts.forEach(d => {
      console.log("Matched Discount:", d.product_category);
    });
  };


  const selectedDiscounts = discount.filter(d => selectedKeys.has(String(d.campaign_id)));
  const hasPercentageDiscount = selectedDiscounts.some(d => d.discount_method === "percentage");

  const handlePointsChange = (e) => {
    let val = Number(e.target.value);
    if (val > maxPoints) val = maxPoints;
    if (val < 0) val = 0;
    setPointsUsed(val);
  };

  return (
    <div className="flex">
      <div className="w-4/5 p-4">
        <div className="gap-2 grid grid-cols-2 sm:grid-cols-4">
          {products.map((item, index) => (
            <Card key={index} isPressable shadow="sm" onPress={() => addToCart(item)}>
              <CardBody className="overflow-visible p-0">
                <Image
                  alt={item.title}
                  className="w-full object-cover h-[140px]"
                  radius="lg"
                  shadow="sm"
                  src={item.img}
                  width="100%"
                />
              </CardBody>
              <CardFooter className="text-small justify-between">
                <b>{item.product_name}</b>
                <p className="text-default-500">{item.price} {item.category_name}</p>

              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="w-2/5 p-4 bg-white shadow-xl h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Cart</h2>

        {cartItems.length === 0 ? (
          <p className="text-gray-500"></p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {cartItems.map((product) => (
              <li key={product.product_id} className="py-4 flex items-center gap-4">
                <img src={product.img} alt={product.product_name} className="w-16 h-16 object-cover rounded-md" />
                <div className="flex-1">
                  <h4 className="font-medium">{product.product_name}</h4>
                  <p className="text-sm text-gray-500">QTY: {product.quantity}</p>
                  <p className="text-sm text-gray-500">Price: {product.price * product.quantity}</p>
                </div>
                <Button onPress={() => removeFromCart(product.product_id)}>
                  <TrashIcon className="h-6 w-6 text-red-500" />
                </Button>


              </li>
            ))}
          </ul>
        )}

        {cartItems.length > 0 && (<div>
          <Select
            className="max-w-xs"
            placeholder="Select Discount(s)"
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={handleSelectionChange}
            items={discount}
          >
            {(discountItem) => (
              <SelectItem key={discountItem.campaign_id} value={discountItem.campaign_id}>
                {discountItem.campaign_name}
              </SelectItem>
            )}
          </Select>

          <p>Selected IDs: {Array.from(selectedKeys).join(", ")}</p>
          {pointsDiscountSelected && hasPercentageDiscount &&(
            <div className="mt-2">
              <label
                htmlFor="pointsInput"
                className="block mb-1 font-semibold"
              >
                จำนวนแต้มที่ใช้ (1 แต้ม = 1 บาท, สูงสุด 20% ของยอดรวม)
              </label>
              <input
                id="pointsInput"
                type="number"
                min={0}
                max={Math.floor(maxPoints)}
                value={pointsUsed}
                onChange={handlePointsChange}
                className="border rounded px-2 py-1 w-full max-w-xs"
              />
              <p className="text-sm text-gray-500 mt-1">
                สูงสุด {Math.floor(maxPoints)} แต้ม
              </p>
            </div>
          )}


          <div className="border-t mt-4 pt-4 text-base font-medium text-gray-900">
            <div className="flex justify-between">
              <p>รวม</p>
              <p>฿{totalPrice.toFixed(2)}</p>
            </div>
            <div className="flex flex-col gap-1 text-sm text-gray-700">
              <div className="flex justify-between">
                <p>รวมส่วนลด</p>
                <p className="font-semibold text-red-500">-฿{totalDiscount.toFixed(2)}</p>
              </div>

              {totalFixedDiscount > 0 && (
                <div className="flex justify-between">
                  <p>ส่วนลดแบบจำนวนเงิน</p>
                  <p>-฿{totalFixedDiscount.toFixed(2)}</p>
                </div>
              )}

              {totalPercentDiscount > 0 && (
                <div className="flex justify-between">
                  <p>ส่วนลดเปอร์เซ็นต์จากยอดรวม</p>
                  <p>-฿{totalPercentDiscount.toFixed(2)}</p>
                </div>
              )}

              {totalCategoryDiscount > 0 && (
                <div className="flex justify-between">
                  <p>ส่วนลดตามหมวดหมู่</p>
                  <p>-฿{totalCategoryDiscount.toFixed(2)}</p>
                </div>
              )}

              {pointsUsed > 0 && (
                <div className="flex justify-between">
                  <p>ส่วนลดจากแต้มที่ใช้</p>
                  <p>-฿{pointsUsed.toFixed(2)}</p>
                </div>
              )}
              {totalSeasonalStepDiscount > 0 && (
                <div className="flex justify-between">
                  <p>ส่วนลดตามเงื่อนไข Seasonal</p>
                  <p>-฿{totalSeasonalStepDiscount.toFixed(2)}</p>
                </div>
              )}

            </div>

            <div className="flex justify-between font-bold text-lg">
              <p>รวมสุทธิ</p>
              <p>฿{finalPrice.toFixed(2)}</p>
            </div>
          </div>

          <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
            Checkout
          </button>
        </div>
        )}
      </div>
    </div>

  );
}
