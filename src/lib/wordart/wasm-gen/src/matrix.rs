use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Copy, Clone, Debug)]
pub struct Matrix {
  pub a: f64,
  pub b: f64,
  pub c: f64,
  pub d: f64,
  pub e: f64,
  pub f: f64,
}

pub enum MatrixTransformError {
  DeterminantIsZero,
}

impl Matrix {
  pub fn new() -> Matrix {
    Matrix {
      a: 1f64,
      b: 0f64,
      c: 0f64,
      d: 1f64,
      e: 0f64,
      f: 0f64,
    }
  }

  pub fn between(from: &Matrix, to: &Matrix, ratio: f64) -> Matrix {
    Matrix {
      a: from.a + (to.a - from.a) * ratio,
      b: from.b + (to.b - from.b) * ratio,
      c: from.c + (to.c - from.c) * ratio,
      d: from.d + (to.d - from.d) * ratio,
      e: from.e + (to.e - from.e) * ratio,
      f: from.f + (to.f - from.f) * ratio,
    }
  }

  pub fn translate_mut(&mut self, x: f64, y: f64) {
    self.e += self.a * x + self.c * y;
    self.f += self.b * x + self.d * y;
  }

  pub fn translate(mut self, x: f64, y: f64) -> Matrix {
    self.translate_mut(x, y);
    self
  }

  pub fn scale_mut(&mut self, x: f64, y: f64) {
    self.a *= x;
    self.b *= x;
    self.c *= y;
    self.d *= y;
  }

  pub fn scale(mut self, x: f64, y: f64) -> Matrix {
    self.scale_mut(x, y);
    self
  }

  pub fn rotate_mut(&mut self, angle: f64) {
    let cos = angle.cos();
    let sin = angle.sin();
    let Matrix { a, b, c, d, .. } = *self;
    self.a = a * cos + c * sin;
    self.b = b * cos + d * sin;
    self.c = c * cos - a * sin;
    self.d = d * cos - b * sin;
  }

  pub fn rotate(mut self, angle: f64) -> Matrix {
    self.rotate_mut(angle);
    self
  }

  pub fn skew_x_mut(&mut self, angle: f64) {
    let tan = angle.tan();
    self.c += self.a * tan;
    self.d += self.b * tan;
  }

  pub fn skew_x(mut self, angle: f64) -> Matrix {
    self.skew_x_mut(angle);
    self
  }

  pub fn skew_y_mut(&mut self, angle: f64) {
    let tan = angle.tan();
    self.a += self.c * tan;
    self.b += self.d * tan;
  }

  pub fn skew_y(mut self, angle: f64) -> Matrix {
    self.skew_y_mut(angle);
    self
  }

  pub fn transform_mut(&mut self, matrix: &Matrix) {
    self.transform_values_mut(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
  }

  pub fn transform_values_mut(&mut self, pa: f64, pb: f64, pc: f64, pd: f64, pe: f64, pf: f64) {
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

  pub fn transform(mut self, matrix: &Matrix) -> Matrix {
    self.transform_mut(matrix);
    self
  }

  pub fn transform_values(
    mut self,
    pa: f64,
    pb: f64,
    pc: f64,
    pd: f64,
    pe: f64,
    pf: f64,
  ) -> Matrix {
    self.transform_values_mut(pa, pb, pc, pd, pe, pf);
    self
  }

  pub fn reset_mut(&mut self) {
    self.set_mut(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
  }

  pub fn set_mut(&mut self, a: f64, b: f64, c: f64, d: f64, e: f64, f: f64) {
    self.a = a;
    self.b = b;
    self.c = c;
    self.d = d;
    self.e = e;
    self.f = f;
  }

  pub fn det(&self) -> f64 {
    self.a * self.d - self.b * self.c
  }

  pub fn inverse_mut(&mut self) -> Result<(), MatrixTransformError> {
    let mut det = self.det();
    if det == 0f64 {
      return Err(MatrixTransformError::DeterminantIsZero);
    }
    det = 1f64 / det;
    let a = self.d * det;
    let b = -self.b * det;
    let c = -self.c * det;
    let d = self.a * det;
    let e = (self.c * self.f - self.e * self.d) * det;
    let f = (self.e * self.b - self.a * self.f) * det;
    self.a = a;
    self.b = b;
    self.c = c;
    self.d = d;
    self.e = e;
    self.f = f;
    Ok(())
  }

  pub fn inverse(mut self) -> Result<Matrix, MatrixTransformError> {
    self.inverse_mut()?;
    Ok(self)
  }
}
