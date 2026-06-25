import React, { useState, useRef } from "react";
import { Product, Transaction } from "../../types";
import { ShoppingCart, Package, DollarSign, Activity, Trash2, ShoppingBag, CreditCard, ShieldCheck, ImagePlus, X, QrCode, Pencil, Check } from "lucide-react";
import qrisKimasImg from "../../assets/images/qris_kimas.jpg";

interface BuyerIdentity {
  nama: string;
  kelas: string;
  noHp: string;
  tempatTinggal: string;
}

interface KimasModuleProps {
  products: Product[];
  transactions: Transaction[];
  currentUser: any;
  onCheckout: (items: { id: string; quantity: number }[], identity: BuyerIdentity) => void;
  onAddProduct?: (product_name: string, price: number, stock: number, image: string) => void;
  onDeleteProduct?: (id: string) => void;
  onUpdateProduct?: (id: string, name: string, price: number, stock: number) => void;
}

export default function KimasModule({
  products,
  transactions,
  currentUser,
  onCheckout,
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct
}: KimasModuleProps) {
  // Store state for customer's cart
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [successPaid, setSuccessPaid] = useState(false);
  const [showQris, setShowQris] = useState(false);

  // Identity form state (step sebelum QRIS)
  const [showIdentityForm, setShowIdentityForm] = useState(false);
  const [identityNama, setIdentityNama] = useState("");
  const [identityKelas, setIdentityKelas] = useState("");
  const [identityNoHp, setIdentityNoHp] = useState("");
  const [identityTempat, setIdentityTempat] = useState("");
  const [identityError, setIdentityError] = useState("");

  // Store state for managing/adding products
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("");
  const [newProdImage, setNewProdImage] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // States for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");

  const startEditing = (p: Product) => {
    setEditingId(p.id);
    setEditName(p.product_name);
    setEditPrice(String(p.price));
    setEditStock(String(p.stock));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditPrice("");
    setEditStock("");
  };

  const saveEditing = (id: string) => {
    if (!editName.trim() || !editPrice || !editStock) return;
    if (onUpdateProduct) {
      onUpdateProduct(id, editName, Number(editPrice), Number(editStock));
    }
    cancelEditing();
  };


  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"marketplace" | "management" | "transactions">("marketplace");

  const isAdmin = currentUser?.role === "admin" || (currentUser?.role === "divisi" && currentUser?.division_id === "div-kimas");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setNewProdImage(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setNewProdImage("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addToCart = (prod: Product) => {
    if (prod.stock <= 0) return;
    const existingIndex = cart.findIndex(item => item.product.id === prod.id);
    if (existingIndex !== -1) {
      if (cart[existingIndex].quantity >= prod.stock) return;
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product: prod, quantity: 1 }]);
    }
  };

  const removeFromCart = (pId: string) => {
    setCart(cart.filter(item => item.product.id !== pId));
  };

  const calculateTotal = () => {
    return cart.reduce((tot, item) => tot + item.product.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const itemsPayload = cart.map(item => ({
      id: item.product.id,
      quantity: item.quantity
    }));
    const identity: BuyerIdentity = {
      nama: identityNama,
      kelas: identityKelas,
      noHp: identityNoHp,
      tempatTinggal: identityTempat,
    };
    onCheckout(itemsPayload, identity);
    setCart([]);
    setSuccessPaid(true);
    // Reset identity form
    setIdentityNama("");
    setIdentityKelas("");
    setIdentityNoHp("");
    setIdentityTempat("");
    setShowIdentityForm(false);
    setShowQris(false);
    setTimeout(() => setSuccessPaid(false), 4000);
  };

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identityNama.trim() || !identityKelas.trim() || !identityNoHp.trim() || !identityTempat.trim()) {
      setIdentityError("Semua field identitas wajib diisi!");
      return;
    }
    setIdentityError("");
    setShowIdentityForm(false);
    setShowQris(true);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdStock) return;
    if (onAddProduct) {
      onAddProduct(newProdName, Number(newProdPrice), Number(newProdStock), newProdImage || "");
      setNewProdName("");
      setNewProdPrice("");
      setNewProdStock("");
      clearImage();
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (onDeleteProduct) {
      onDeleteProduct(id);
    }
    setDeleteConfirmId(null);
  };

  // Helper to render product image (supports base64, URL, or fallback)
  const ProductImage = ({ src, className }: { src: string; className?: string }) => {
    const isEmoji = src && [...src].length <= 4 && !/^(data:|http|\/)/i.test(src);
    if (isEmoji || !src) {
      return (
        <div className={`flex items-center justify-center bg-[#16161a] border border-dark-border rounded-lg ${className || "w-16 h-16"}`}>
          <span className="text-4xl select-none">{src || "📦"}</span>
        </div>
      );
    }
    return (
      <img
        src={src}
        alt="Produk"
        className={`object-cover rounded-lg border border-dark-border bg-[#16161a] ${className || "w-16 h-16"}`}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* KIMAS GENERAL TELEMETRY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs font-mono mb-2 uppercase">Total Katalog Merchandise</div>
          <div className="text-3xl font-display font-bold text-white">{products.length}</div>
          <div className="text-xs text-brand-orange mt-2 flex items-center gap-1">
            <Package size={12} /> Unit Bisnis Mandiri
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs font-mono mb-2 uppercase">Total Omset Toko</div>
          <div className="text-3xl font-display font-bold text-white">
            Rp {transactions.reduce((acc, t) => acc + t.total, 0).toLocaleString("id")}
          </div>
          <div className="text-xs text-green-400 mt-2 flex items-center gap-1">
            <DollarSign size={12} /> Ke Keuangan Himpunan
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs font-mono mb-2 uppercase">Sistem Pembayaran</div>
          <div className="text-3xl font-display font-bold text-white">4 Ops</div>
          <div className="text-xs text-blue-400 mt-2">
            Simulasi Gateway Aktif
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs font-mono mb-2 uppercase">Barang Terjual</div>
          <div className="text-3xl font-display font-bold text-white">
            {products.reduce((acc, p) => acc + (p.sold || 0), 0)} Items
          </div>
          <div className="text-xs text-purple-400 mt-2">
            Tracking log inventaris otomatis
          </div>
        </div>
      </div>

      {/* SEGMENT TOGGLES */}
      <div className="flex gap-2 border-b border-dark-border pb-3 bg-dark-bg/25 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("marketplace")}
          className={`px-4 py-2 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === "marketplace" ? "bg-brand-orange text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <ShoppingBag size={13} /> Marketplace Internal
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("management")}
            className={`px-4 py-2 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "management" ? "bg-brand-orange text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <ImagePlus size={13} /> Kelola Produk & Stok
          </button>
        )}
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === "transactions" ? "bg-brand-orange text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Activity size={13} /> Daftar Penjualan & Transaksi
        </button>
      </div>

      {/* TAB: MARKETPLACE */}
      {activeTab === "marketplace" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CATALOG */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-white">Merchandise Resmi POINTER</h3>
              <span className="text-xs text-gray-500 font-mono">Pilih barang untuk dimasukkan keranjang</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p) => {
                const outOfStock = p.stock <= 0;
                return (
                  <div key={p.id} className="bg-dark-surface border border-dark-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-orange/40 transition">
                    <div className="flex gap-4">
                      {/* Product image */}
                      <ProductImage src={p.image} className="w-16 h-16 flex-shrink-0" />
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white text-xs">{p.product_name}</h4>
                        <div className="text-sm font-display font-bold text-brand-orange">
                          Rp {p.price.toLocaleString("id")}
                        </div>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                          outOfStock ? "bg-red-500/10 text-red-400 border border-red-500/10" : "bg-green-500/10 text-green-400 border border-green-500/10"
                        }`}>
                          {outOfStock ? "STOK HABIS" : `Stok: ${p.stock}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(p)}
                      disabled={outOfStock}
                      className="mt-4 w-full bg-[#1b1b1f] hover:bg-brand-orange text-white hover:text-white font-semibold rounded text-xs py-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {outOfStock ? "Tidak Tersedia" : "+ Tambah ke Keranjang"}
                    </button>
                  </div>
                );
              })}
              {products.length === 0 && (
                <div className="col-span-2 text-center py-16 text-gray-500 text-xs">
                  Belum ada produk tersedia di toko.
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR CART */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 h-fit space-y-4">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2 border-b border-dark-border pb-3">
              <ShoppingCart className="text-brand-orange" size={20} />
              Keranjang Belanja
            </h3>

            {successPaid && (
              <div className="bg-green-500/15 border border-green-500/30 text-green-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <ShieldCheck size={18} /> Pembayaran Sukses! Stok berkurang, invoice tercatat otomatis.
              </div>
            )}

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center bg-dark-bg p-2 rounded border border-dark-border">
                  <div className="flex items-center gap-2">
                    <ProductImage src={item.product.image} className="w-9 h-9 rounded flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">{item.product.product_name}</h4>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {item.quantity}x @ Rp {item.product.price.toLocaleString("id")}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-gray-500 hover:text-red-500 p-1 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {cart.length === 0 && !successPaid && (
                <div className="text-center py-8 text-gray-500 text-xs">Keranjang Anda masih kosong.</div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-dark-border pt-4 space-y-4">
                <div className="flex justify-between items-center bg-dark-bg p-3 border border-dark-border rounded-lg">
                  <span className="text-xs text-gray-400 uppercase font-mono">Total Bayar:</span>
                  <span className="text-base font-display font-bold text-brand-orange">
                    Rp {calculateTotal().toLocaleString("id")}
                  </span>
                </div>

                {!showIdentityForm && !showQris ? (
                  <button
                    onClick={() => setShowIdentityForm(true)}
                    className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2.5 rounded transition flex items-center justify-center gap-1.5"
                  >
                    <QrCode size={14} /> Bayar via QRIS
                  </button>
                ) : showIdentityForm ? (
                  /* ---- FORM IDENTITAS PEMBELI ---- */
                  <div className="space-y-3">
                    <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-brand-orange font-semibold uppercase tracking-wide">⚠ Wajib Isi Identitas</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Lengkapi data diri Anda sebelum melanjutkan pembayaran.</p>
                    </div>

                    <form onSubmit={handleIdentitySubmit} className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-gray-500">Nama Lengkap <span className="text-brand-orange">*</span></label>
                        <input
                          type="text"
                          placeholder="cth. Andi Prasetyo"
                          value={identityNama}
                          onChange={(e) => { setIdentityNama(e.target.value); setIdentityError(""); }}
                          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange transition"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-gray-500">Kelas <span className="text-brand-orange">*</span></label>
                        <input
                          type="text"
                          placeholder="cth. TI-3A / IF-2B"
                          value={identityKelas}
                          onChange={(e) => { setIdentityKelas(e.target.value); setIdentityError(""); }}
                          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange transition"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-gray-500">No. HP / WhatsApp <span className="text-brand-orange">*</span></label>
                        <input
                          type="tel"
                          placeholder="cth. 08123456789"
                          value={identityNoHp}
                          onChange={(e) => { setIdentityNoHp(e.target.value); setIdentityError(""); }}
                          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange transition"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-gray-500">Tempat Tinggal <span className="text-brand-orange">*</span></label>
                        <input
                          type="text"
                          placeholder="cth. Kos Jl. Merdeka No. 12, Bandung"
                          value={identityTempat}
                          onChange={(e) => { setIdentityTempat(e.target.value); setIdentityError(""); }}
                          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange transition"
                          required
                        />
                      </div>

                      {identityError && (
                        <p className="text-red-400 text-[10px] font-mono">{identityError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2.5 rounded transition flex items-center justify-center gap-1.5"
                      >
                        <QrCode size={14} /> Lanjut ke Pembayaran QRIS
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowIdentityForm(false); setIdentityError(""); }}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs font-semibold py-2 rounded transition"
                      >
                        Batal
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Ringkasan Identitas */}
                    <div className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 space-y-1">
                      <p className="text-[10px] font-mono text-gray-500 uppercase">Identitas Pembeli</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                        <span className="text-gray-500">Nama</span><span className="text-white font-semibold truncate">{identityNama}</span>
                        <span className="text-gray-500">Kelas</span><span className="text-white font-semibold">{identityKelas}</span>
                        <span className="text-gray-500">No. HP</span><span className="text-white font-semibold">{identityNoHp}</span>
                        <span className="text-gray-500">Alamat</span><span className="text-white font-semibold truncate">{identityTempat}</span>
                      </div>
                    </div>

                    {/* QRIS Image */}
                    <div className="bg-white rounded-xl p-3 flex flex-col items-center">
                      <img
                        src={qrisKimasImg}
                        alt="QRIS KIMAS"
                        className="w-full max-w-[220px] rounded-lg"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 text-center font-mono">
                      Scan QR di atas dengan aplikasi e-wallet / m-banking Anda
                    </p>
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2.5 rounded transition flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={14} /> Konfirmasi Sudah Bayar
                    </button>
                    <button
                      onClick={() => { setShowQris(false); setShowIdentityForm(true); }}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs font-semibold py-2 rounded transition"
                    >
                      ← Ubah Identitas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PRODUCT STOCK MANAGEMENT */}
      {activeTab === "management" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CATALOG TABLE WITH DELETE */}
          <div className="lg:col-span-2 bg-dark-surface border border-dark-border rounded-xl p-6">
            <h3 className="font-display font-medium text-white mb-4">Ubah stok & Atur Produk KIMAS</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141418] text-gray-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Produk</th>
                    <th className="p-3">Harga Satuan</th>
                    <th className="p-3">Stok Gudang</th>
                    <th className="p-3">Terjual</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {products.map((p) => {
                    const isEditing = editingId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-dark-bg/40 transition">
                        <td className="p-3 text-white font-semibold">
                          <div className="flex items-center gap-2">
                            <ProductImage src={p.image} className="w-10 h-10 rounded flex-shrink-0" />
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white w-full max-w-[160px] focus:outline-none focus:border-brand-orange"
                                required
                              />
                            ) : (
                              <span>{p.product_name}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-gray-400 font-mono">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500 text-[11px]">Rp</span>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white w-20 font-mono focus:outline-none focus:border-brand-orange"
                                required
                              />
                            </div>
                          ) : (
                            <span>Rp {p.price.toLocaleString("id")}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white w-16 font-mono focus:outline-none focus:border-brand-orange"
                              required
                            />
                          ) : (
                            <span className={`inline-block px-2.5 py-0.5 rounded font-mono ${
                              p.stock <= 5 ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                            }`}>
                              {p.stock}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-gray-400">{p.sold || 0} pcs</td>
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => saveEditing(p.id)}
                                className="text-green-500 hover:text-green-400 p-1.5 rounded hover:bg-green-500/10 transition"
                                title="Simpan"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-zinc-700 transition"
                                title="Batal"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : deleteConfirmId === p.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="text-[10px] px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition"
                              >
                                Hapus
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[10px] px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-bold transition"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => startEditing(p)}
                                className="text-gray-500 hover:text-brand-orange transition p-1.5 rounded hover:bg-brand-orange/10"
                                title="Edit Produk"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(p.id)}
                                className="text-gray-500 hover:text-red-500 transition p-1.5 rounded hover:bg-red-500/10"
                                title="Hapus Produk"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Belum ada produk di katalog.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADD PRODUCT FORM */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
            <h3 className="font-display font-bold text-base text-white mb-4 flex items-center gap-2 border-b border-dark-border pb-3">
              <ShoppingBag className="text-brand-orange" size={20} />
              Tambahkan Produk Baru
            </h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-gray-500">Nama Produk</label>
                <input
                  type="text"
                  placeholder="cth. Hoodie Angkatan POINTER"
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-gray-500">Harga Jual</label>
                  <input
                    type="number"
                    placeholder="Rp"
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-gray-500">Stok Awal</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-gray-500">Foto Produk</label>
                {imagePreview ? (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden border border-dark-border bg-[#141418]">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-28 border-2 border-dashed border-dark-border hover:border-brand-orange/60 rounded-lg flex flex-col items-center justify-center gap-2 transition cursor-pointer bg-dark-bg"
                  >
                    <ImagePlus size={22} className="text-gray-500" />
                    <span className="text-[11px] text-gray-500">Klik untuk upload gambar produk</span>
                    <span className="text-[10px] text-gray-600">JPG, PNG, WEBP (maks. 5MB)</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2.5 rounded transition"
              >
                + Publis ke Toko Sekarang
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: TRANSACTIONS LIST */}
      {activeTab === "transactions" && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 border-b border-dark-border pb-3">
            <h3 className="font-display font-medium text-white flex items-center gap-2">
              <Activity className="text-brand-orange" size={20} />
              Arsip Transaksi Penjualan KIMAS
            </h3>
            <span className="text-xs text-gray-500 font-mono">Sinkron otomatis dengan kas keuangan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141418] text-gray-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-3">Ref Transaksi</th>
                  <th className="p-3">Nama Pembeli</th>
                  <th className="p-3">Item Terbeli</th>
                  <th className="p-3">Tanggal Penjualan</th>
                  <th className="p-3 text-right">Volume Dana</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3 font-mono text-gray-400 text-[11px]">{t.id}</td>
                    <td className="p-3 text-white font-medium">{t.student_name}</td>
                    <td className="p-3 text-gray-300 max-w-[280px] truncate">{t.items_text}</td>
                    <td className="p-3 text-gray-400 font-mono">{t.date}</td>
                    <td className="p-3 text-right text-green-400 font-mono font-bold">
                      Rp {t.total.toLocaleString("id")}
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/10 uppercase">
                        {t.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Belum ada transaksi tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
