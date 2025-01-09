# ゲーム開発における物理演算とコリジョンの基礎

このサンプルコードから、ゲームの基本的な物理演算とコリジョン（衝突判定）について説明します。

## 1. 基本的な物理演算

### 重力と摩擦
```javascript
// 物理定数
const GRAVITY = 0.3;      // 重力加速度
const FRICTION = 0.9;     // 摩擦係数

// 重力と摩擦の適用
player.vy += GRAVITY;     // 重力による落下
player.vx *= FRICTION;    // 水平方向の減速
```
- 重力：キャラクターを下に引っ張る力
- 摩擦：水平方向の動きを徐々に減速させる

### 移動と速度
```javascript
// 位置の更新
player.x += player.vx;    // x方向の移動
player.y += player.vy;    // y方向の移動
```
- 速度（vx, vy）に基づいて位置を更新
- 毎フレーム この計算を繰り返す

## 2. コリジョン（衝突判定）

### 基本的な矩形衝突
```javascript
function isRectColliding(r1, r2) {
    // 矩形同士が重なっているかをチェック
    if(r1.x + r1.width < r2.x) return false;
    if(r1.x > r2.x + r2.width) return false;
    if(r1.y + r1.height < r2.y) return false;
    if(r1.y > r2.y + r2.height) return false;
    return true;
}
```
- 二つの四角形が重なっているかを判定する最もシンプルな方法
- x軸とy軸それぞれで重なりをチェック

### 衝突後の処理
```javascript
// 跳ね返り係数
const BOUNCE_FACTOR = 0.3;

// 衝突時の速度反転
obj.vx = -obj.vx * BOUNCE_FACTOR;
obj.vy = -obj.vy * BOUNCE_FACTOR;
```
- 衝突時に速度を反転させて跳ね返り表現
- BOUNCE_FACTORで跳ね返りの強さを調整

## 3. 実践的なポイント

- 物理演算は単純な数式の組み合わせ
- コリジョンは「重なっているかどうか」の判定が基本
- 実際のゲームでは、これらを組み合わせて自然な動きを実現
- パラメータ（重力、摩擦、跳ね返り）の調整で挙動が大きく変わる

これらの基本を理解すれば、ジャンプアクションやアクションゲームの基礎的な動きを作ることができます。
