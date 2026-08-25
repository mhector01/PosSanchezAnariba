-- Multi-bodega para Grupo Sanchez Anariba POS.
-- Compatible con versiones que no soportan ADD COLUMN/INDEX IF NOT EXISTS.
-- Es idempotente: se puede volver a ejecutar si una ejecución anterior quedó incompleta.
SET @db := DATABASE();

CREATE TABLE IF NOT EXISTS bodega (
  idbodega INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  descripcion VARCHAR(255) NULL,
  principal TINYINT(1) NOT NULL DEFAULT 0,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idbodega),
  UNIQUE KEY uk_bodega_nombre (nombre)
) ENGINE=InnoDB;

INSERT INTO bodega (nombre, descripcion, principal, estado)
SELECT 'Bodega principal', 'Inventario existente al habilitar multi-bodega', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM bodega);

SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='usuario' AND COLUMN_NAME='idbodega'),
  'SELECT 1',
  'ALTER TABLE usuario ADD COLUMN idbodega INT NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='usuario' AND INDEX_NAME='ix_usuario_bodega'),
  'SELECT 1',
  'ALTER TABLE usuario ADD INDEX ix_usuario_bodega (idbodega)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS bodega_producto (
  idbodega INT NOT NULL,
  idproducto INT NOT NULL,
  stock DECIMAL(12,2) NOT NULL DEFAULT 0,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idbodega, idproducto),
  CONSTRAINT fk_bp_bodega FOREIGN KEY (idbodega) REFERENCES bodega(idbodega),
  CONSTRAINT fk_bp_producto FOREIGN KEY (idproducto) REFERENCES producto(idproducto)
) ENGINE=InnoDB;

SET @bodega_principal := (SELECT idbodega FROM bodega WHERE principal = 1 ORDER BY idbodega LIMIT 1);
INSERT INTO bodega_producto (idbodega, idproducto, stock)
SELECT @bodega_principal, p.idproducto, p.stock FROM producto p
ON DUPLICATE KEY UPDATE stock = VALUES(stock);
UPDATE usuario SET idbodega = @bodega_principal WHERE idbodega IS NULL AND tipo_usuario <> 1;

CREATE TABLE IF NOT EXISTS transferencia_bodega (
  idtransferencia BIGINT NOT NULL AUTO_INCREMENT,
  numero VARCHAR(30) NULL,
  idbodega_origen INT NOT NULL,
  idbodega_destino INT NOT NULL,
  estado ENUM('PENDIENTE','EN_TRANSITO','RECIBIDA','CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
  observacion VARCHAR(500) NULL,
  creado_por INT NOT NULL,
  enviado_por INT NULL,
  recibido_por INT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  enviado_en DATETIME NULL,
  recibido_en DATETIME NULL,
  PRIMARY KEY (idtransferencia),
  UNIQUE KEY uk_transferencia_numero (numero),
  CONSTRAINT fk_tb_origen FOREIGN KEY (idbodega_origen) REFERENCES bodega(idbodega),
  CONSTRAINT fk_tb_destino FOREIGN KEY (idbodega_destino) REFERENCES bodega(idbodega),
  CONSTRAINT fk_tb_creado FOREIGN KEY (creado_por) REFERENCES usuario(idusuario),
  CONSTRAINT fk_tb_enviado FOREIGN KEY (enviado_por) REFERENCES usuario(idusuario),
  CONSTRAINT fk_tb_recibido FOREIGN KEY (recibido_por) REFERENCES usuario(idusuario),
  CONSTRAINT ck_bodegas_distintas CHECK (idbodega_origen <> idbodega_destino)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transferencia_bodega_detalle (
  iddetalle BIGINT NOT NULL AUTO_INCREMENT,
  idtransferencia BIGINT NOT NULL,
  idproducto INT NOT NULL,
  cantidad DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (iddetalle),
  UNIQUE KEY uk_transferencia_producto (idtransferencia, idproducto),
  CONSTRAINT fk_tbd_transferencia FOREIGN KEY (idtransferencia) REFERENCES transferencia_bodega(idtransferencia) ON DELETE CASCADE,
  CONSTRAINT fk_tbd_producto FOREIGN KEY (idproducto) REFERENCES producto(idproducto),
  CONSTRAINT ck_transferencia_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='venta' AND COLUMN_NAME='idbodega'),
  'SELECT 1',
  'ALTER TABLE venta ADD COLUMN idbodega INT NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='compra' AND COLUMN_NAME='idbodega'),
  'SELECT 1',
  'ALTER TABLE compra ADD COLUMN idbodega INT NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
UPDATE venta SET idbodega = @bodega_principal WHERE idbodega IS NULL;
UPDATE compra SET idbodega = @bodega_principal WHERE idbodega IS NULL;

SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='usuario' AND CONSTRAINT_NAME='fk_usuario_bodega'),
  'SELECT 1',
  'ALTER TABLE usuario ADD CONSTRAINT fk_usuario_bodega FOREIGN KEY (idbodega) REFERENCES bodega(idbodega)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='venta' AND INDEX_NAME='ix_venta_bodega'),
  'SELECT 1',
  'ALTER TABLE venta ADD INDEX ix_venta_bodega (idbodega)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='venta' AND CONSTRAINT_NAME='fk_venta_bodega'),
  'SELECT 1',
  'ALTER TABLE venta ADD CONSTRAINT fk_venta_bodega FOREIGN KEY (idbodega) REFERENCES bodega(idbodega)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='compra' AND INDEX_NAME='ix_compra_bodega'),
  'SELECT 1',
  'ALTER TABLE compra ADD INDEX ix_compra_bodega (idbodega)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='compra' AND CONSTRAINT_NAME='fk_compra_bodega'),
  'SELECT 1',
  'ALTER TABLE compra ADD CONSTRAINT fk_compra_bodega FOREIGN KEY (idbodega) REFERENCES bodega(idbodega)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
