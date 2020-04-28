use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Copy, Clone, PartialEq, Debug, Serialize)]
pub struct Matrix {
  pub a: f32,
  pub b: f32,
  pub c: f32,
  pub d: f32,
  pub e: f32,
  pub f: f32,
}

pub enum MatrixTransformError {
  DeterminantIsZero,
}

#[wasm_bindgen]
impl Matrix {
  #[wasm_bindgen(constructor)]
  pub fn new() -> Matrix {
    Matrix {
      a: 1f32,
      b: 0f32,
      c: 0f32,
      d: 1f32,
      e: 0f32,
      f: 0f32,
    }
  }

  #[wasm_bindgen]
  pub fn copy(&self) -> Matrix {
    Matrix {
      a: self.a,
      b: self.b,
      c: self.c,
      d: self.d,
      e: self.e,
      f: self.f,
    }
  }

  pub fn between(from: &Matrix, to: &Matrix, ratio: f32) -> Matrix {
    Matrix {
      a: from.a + (to.a - from.a) * ratio,
      b: from.b + (to.b - from.b) * ratio,
      c: from.c + (to.c - from.c) * ratio,
      d: from.d + (to.d - from.d) * ratio,
      e: from.e + (to.e - from.e) * ratio,
      f: from.f + (to.f - from.f) * ratio,
    }
  }

  pub fn translate_mut(&mut self, x: f32, y: f32) {
    self.e += self.a * x + self.c * y;
    self.f += self.b * x + self.d * y;
  }

  pub fn translate(mut self, x: f32, y: f32) -> Matrix {
    self.translate_mut(x, y);
    self
  }

  pub fn scale_mut(&mut self, x: f32, y: f32) {
    self.a *= x;
    self.b *= x;
    self.c *= y;
    self.d *= y;
  }

  pub fn scale(mut self, x: f32, y: f32) -> Matrix {
    self.scale_mut(x, y);
    self
  }

  pub fn rotate_mut(&mut self, angle: f32) {
    let cos = angle.cos();
    let sin = angle.sin();
    let Matrix { a, b, c, d, .. } = *self;
    self.a = a * cos + c * sin;
    self.b = b * cos + d * sin;
    self.c = c * cos - a * sin;
    self.d = d * cos - b * sin;
  }

  pub fn rotate(mut self, angle: f32) -> Matrix {
    self.rotate_mut(angle);
    self
  }

  pub fn skew_x_mut(&mut self, angle: f32) {
    let tan = angle.tan();
    self.c += self.a * tan;
    self.d += self.b * tan;
  }

  pub fn skew_x(mut self, angle: f32) -> Matrix {
    self.skew_x_mut(angle);
    self
  }

  pub fn skew_y_mut(&mut self, angle: f32) {
    let tan = angle.tan();
    self.a += self.c * tan;
    self.b += self.d * tan;
  }

  pub fn skew_y(mut self, angle: f32) -> Matrix {
    self.skew_y_mut(angle);
    self
  }

  pub fn transform_mut(&mut self, matrix: &Matrix) {
    self.transform_values_mut(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
  }

  pub fn transform_values_mut(&mut self, pa: f32, pb: f32, pc: f32, pd: f32, pe: f32, pf: f32) {
    let a = self.a;
    let b = self.b;
    let c = self.c;
    let d = self.d;
    self.a = a * pa + c * pb;
    self.b = b * pa + d * pb;
    self.c = a * pc + c * pd;
    self.d = b * pc + d * pd;
    self.e += a * pe + c * pf;
    self.f += b * pe + d * pf;
  }

  pub fn transform(&self, matrix: &Matrix) -> Matrix {
    let mut result = Matrix {
      a: self.a,
      b: self.b,
      c: self.c,
      d: self.d,
      e: self.e,
      f: self.f,
    };
    result.transform_mut(matrix);
    return result;
  }

  pub fn transform_values(
    mut self,
    pa: f32,
    pb: f32,
    pc: f32,
    pd: f32,
    pe: f32,
    pf: f32,
  ) -> Matrix {
    self.transform_values_mut(pa, pb, pc, pd, pe, pf);
    self
  }

  pub fn reset_mut(&mut self) {
    self.set_mut(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
  }

  pub fn set_mut(&mut self, a: f32, b: f32, c: f32, d: f32, e: f32, f: f32) {
    self.a = a;
    self.b = b;
    self.c = c;
    self.d = d;
    self.e = e;
    self.f = f;
  }

  pub fn det(&self) -> f32 {
    self.a * self.d - self.b * self.c
  }
}
