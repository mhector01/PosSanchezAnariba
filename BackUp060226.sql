-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 06-02-2026 a las 08:38:13
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `posnext`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `abono`
--

CREATE TABLE `abono` (
  `idabono` int(11) NOT NULL,
  `idcredito` int(11) NOT NULL,
  `fecha_abono` datetime NOT NULL,
  `monto_abono` decimal(8,2) NOT NULL,
  `total_abonado` decimal(8,2) DEFAULT 0.00,
  `restante_credito` decimal(8,2) NOT NULL DEFAULT 0.00,
  `idusuario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `apartado`
--

CREATE TABLE `apartado` (
  `idapartado` int(11) NOT NULL,
  `numero_apartado` varchar(175) DEFAULT NULL,
  `fecha_apartado` datetime NOT NULL,
  `fecha_limite_retiro` datetime NOT NULL,
  `sumas` decimal(8,2) NOT NULL,
  `iva` decimal(8,2) NOT NULL,
  `exento` decimal(8,2) NOT NULL,
  `retenido` decimal(8,2) NOT NULL,
  `descuento` decimal(8,2) NOT NULL,
  `total` decimal(8,2) NOT NULL,
  `abonado_apartado` decimal(8,2) NOT NULL DEFAULT 0.00,
  `restante_pagar` decimal(8,2) NOT NULL DEFAULT 0.00,
  `sonletras` varchar(150) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  `idcliente` int(11) DEFAULT NULL,
  `idusuario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `apartado`
--
DELIMITER $$
CREATE TRIGGER `generar_numero_apartado` BEFORE INSERT ON `apartado` FOR EACH ROW BEGIN
        DECLARE numero INT(11);
        SET numero = (SELECT max(idapartado) FROM apartado);
		IF numero IS NULL then
		  set numero=1;
        SET NEW.numero_apartado='APR00000001';
		ELSEIF numero >= 1 and numero < 9 then
			set numero=numero+1;
		SET NEW.numero_apartado=(select concat('APR0000000',CAST(numero AS CHAR)));
		ELSEIF numero >=9 and numero<=99 then
			set numero=numero+1;
		SET NEW.numero_apartado=(select concat('APR000000',CAST(numero AS CHAR)));
		ELSEIF numero>=99 and numero<=999 then
			set numero=numero+1;
		SET NEW.numero_apartado=(select concat('APR00000',CAST(numero AS CHAR)));
		ELSEIF numero>=999 and numero<=9999 then
		   set numero=numero+1;
		SET NEW.numero_apartado=(select concat('APR0000',CAST(numero AS CHAR)));
		ELSEIF numero>=9999 and numero<=99999 then
			set numero=numero+1;
		SET NEW.numero_apartado=(select concat('APR000',CAST(numero AS CHAR)));
		ELSEIF numero>=99999 and numero<=999999 then
			set numero=numero+1;
		SET NEW.numero_apartado=(select concat('APR00',CAST(numero AS CHAR)));
		ELSEIF numero>=999999 and numero<=9999999 then
			set numero=numero+1;
		SET NEW.numero_apartado=(select concat('APR0',CAST(numero AS CHAR)));
        ELSEIF numero>=9999999  then 			set numero=numero+1;
		SET NEW.numero_apartado=(select concat('APR',CAST(numero AS CHAR)));
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `caja`
--

CREATE TABLE `caja` (
  `idcaja` int(11) NOT NULL,
  `fecha_apertura` datetime NOT NULL,
  `monto_apertura` decimal(8,2) NOT NULL,
  `monto_cierre` decimal(8,2) DEFAULT 0.00,
  `fecha_cierre` datetime DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `caja_movimiento`
--

CREATE TABLE `caja_movimiento` (
  `idcaja` int(11) NOT NULL,
  `tipo_movimiento` tinyint(1) NOT NULL DEFAULT 0,
  `monto_movimiento` decimal(8,2) NOT NULL,
  `descripcion_movimiento` varchar(80) DEFAULT NULL,
  `fecha_movimiento` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categoria`
--

CREATE TABLE `categoria` (
  `idcategoria` int(11) NOT NULL,
  `nombre_categoria` varchar(120) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cliente`
--

CREATE TABLE `cliente` (
  `idcliente` int(11) NOT NULL,
  `codigo_cliente` varchar(175) DEFAULT NULL,
  `nombre_cliente` varchar(150) NOT NULL,
  `numero_nit` varchar(70) DEFAULT NULL,
  `numero_nrc` varchar(70) DEFAULT NULL,
  `direccion_cliente` varchar(100) DEFAULT NULL,
  `numero_telefono` varchar(70) DEFAULT NULL,
  `email` varchar(80) DEFAULT NULL,
  `giro` varchar(80) DEFAULT NULL,
  `limite_credito` decimal(8,2) NOT NULL DEFAULT 0.00,
  `estado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `cliente`
--
DELIMITER $$
CREATE TRIGGER `generar_codigo_cliente` BEFORE INSERT ON `cliente` FOR EACH ROW BEGIN
        DECLARE numero INT;
        SET numero = (SELECT max(idcliente) FROM cliente);
		IF numero IS NULL then
		  set numero=1;
        SET NEW.codigo_cliente='CL00000001';
		ELSEIF numero >= 1 and numero < 9 then
			set numero=numero+1;
		SET NEW.codigo_cliente=(select concat('CL0000000',CAST(numero AS CHAR)));
		ELSEIF numero >=9 and numero<=99 then
			set numero=numero+1;
		SET NEW.codigo_cliente=(select concat('CL000000',CAST(numero AS CHAR)));
		ELSEIF numero>=99 and numero<=999 then
			set numero=numero+1;
		SET NEW.codigo_cliente=(select concat('CL00000',CAST(numero AS CHAR)));
		ELSEIF numero>=999 and numero<=9999 then
		   set numero=numero+1;
		SET NEW.codigo_cliente=(select concat('CL0000',CAST(numero AS CHAR)));
		ELSEIF numero>=9999 and numero<=99999 then
			set numero=numero+1;
		SET NEW.codigo_cliente=(select concat('CL000',CAST(numero AS CHAR)));
		ELSEIF numero>=99999 and numero<=999999 then
			set numero=numero+1;
		SET NEW.codigo_cliente=(select concat('CL00',CAST(numero AS CHAR)));
		ELSEIF numero>=999999 and numero<=9999999 then
			set numero=numero+1;
		SET NEW.codigo_cliente=(select concat('CL0',CAST(numero AS CHAR)));
        ELSEIF numero>=9999999  then 			set numero=numero+1;
		SET NEW.codigo_cliente=(select concat('CL',CAST(numero AS CHAR)));
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compra`
--

CREATE TABLE `compra` (
  `idcompra` int(11) NOT NULL,
  `fecha_compra` datetime NOT NULL,
  `idproveedor` int(11) NOT NULL,
  `tipo_pago` varchar(75) NOT NULL,
  `numero_comprobante` varchar(60) NOT NULL,
  `tipo_comprobante` varchar(60) NOT NULL,
  `fecha_comprobante` date DEFAULT NULL,
  `sumas` decimal(8,2) NOT NULL,
  `iva` decimal(8,2) NOT NULL,
  `exento` decimal(8,2) NOT NULL,
  `retenido` decimal(8,2) NOT NULL,
  `total` decimal(8,2) NOT NULL,
  `sonletras` varchar(150) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comprobante`
--

CREATE TABLE `comprobante` (
  `idcomprobante` int(11) NOT NULL,
  `nombre_comprobante` varchar(75) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cotizacion`
--

CREATE TABLE `cotizacion` (
  `idcotizacion` int(11) NOT NULL,
  `numero_cotizacion` varchar(175) DEFAULT NULL,
  `fecha_cotizacion` datetime NOT NULL,
  `a_nombre` varchar(175) DEFAULT NULL,
  `tipo_pago` varchar(60) NOT NULL,
  `entrega` varchar(60) NOT NULL,
  `sumas` decimal(8,2) NOT NULL,
  `iva` decimal(8,2) NOT NULL,
  `exento` decimal(8,2) NOT NULL,
  `retenido` decimal(8,2) NOT NULL,
  `descuento` decimal(8,2) NOT NULL,
  `total` decimal(8,2) NOT NULL,
  `sonletras` varchar(150) NOT NULL,
  `idusuario` int(11) NOT NULL,
  `idcliente` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Disparadores `cotizacion`
--
DELIMITER $$
CREATE TRIGGER `generar_numero_cotizacion` BEFORE INSERT ON `cotizacion` FOR EACH ROW BEGIN
        DECLARE numero INT(11);
        SET numero = (SELECT max(idcotizacion) FROM cotizacion);
		IF numero IS NULL then
		  set numero=1;
        SET NEW.numero_cotizacion='COTI00000001';
		ELSEIF numero >= 1 and numero < 9 then
			set numero=numero+1;
		SET NEW.numero_cotizacion=(select concat('COTI0000000',CAST(numero AS CHAR)));
		ELSEIF numero >=9 and numero<=99 then
			set numero=numero+1;
		SET NEW.numero_cotizacion=(select concat('COTI000000',CAST(numero AS CHAR)));
		ELSEIF numero>=99 and numero<=999 then
			set numero=numero+1;
		SET NEW.numero_cotizacion=(select concat('COTI00000',CAST(numero AS CHAR)));
		ELSEIF numero>=999 and numero<=9999 then
		   set numero=numero+1;
		SET NEW.numero_cotizacion=(select concat('COTI0000',CAST(numero AS CHAR)));
		ELSEIF numero>=9999 and numero<=99999 then
			set numero=numero+1;
		SET NEW.numero_cotizacion=(select concat('COTI000',CAST(numero AS CHAR)));
		ELSEIF numero>=99999 and numero<=999999 then
			set numero=numero+1;
		SET NEW.numero_cotizacion=(select concat('COTI00',CAST(numero AS CHAR)));
		ELSEIF numero>=999999 and numero<=9999999 then
			set numero=numero+1;
		SET NEW.numero_cotizacion=(select concat('COTI0',CAST(numero AS CHAR)));
        ELSEIF numero>=9999999  then 			set numero=numero+1;
		SET NEW.numero_cotizacion=(select concat('COTI',CAST(numero AS CHAR)));
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `credito`
--

CREATE TABLE `credito` (
  `idcredito` int(11) NOT NULL,
  `idventa` int(11) DEFAULT NULL,
  `codigo_credito` varchar(175) DEFAULT NULL,
  `nombre_credito` varchar(120) NOT NULL,
  `fecha_credito` datetime NOT NULL,
  `monto_credito` decimal(8,2) NOT NULL,
  `monto_abonado` decimal(8,2) NOT NULL DEFAULT 0.00,
  `monto_restante` decimal(8,2) NOT NULL DEFAULT 0.00,
  `estado` tinyint(1) NOT NULL DEFAULT 0,
  `idcliente` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `credito`
--
DELIMITER $$
CREATE TRIGGER `generar_numero_credito` BEFORE INSERT ON `credito` FOR EACH ROW BEGIN
        DECLARE numero INT(11);
        SET numero = (SELECT max(idcredito) FROM credito);
		IF numero IS NULL then
		  set numero=1;
        SET NEW.codigo_credito='CRED00000001';
		ELSEIF numero >= 1 and numero < 9 then
			set numero=numero+1;
		SET NEW.codigo_credito=(select concat('CRED0000000',CAST(numero AS CHAR)));
		ELSEIF numero >=9 and numero<=99 then
			set numero=numero+1;
		SET NEW.codigo_credito=(select concat('CRED000000',CAST(numero AS CHAR)));
		ELSEIF numero>=99 and numero<=999 then
			set numero=numero+1;
		SET NEW.codigo_credito=(select concat('CRED00000',CAST(numero AS CHAR)));
		ELSEIF numero>=999 and numero<=9999 then
		   set numero=numero+1;
		SET NEW.codigo_credito=(select concat('CRED0000',CAST(numero AS CHAR)));
		ELSEIF numero>=9999 and numero<=99999 then
			set numero=numero+1;
		SET NEW.codigo_credito=(select concat('CRED000',CAST(numero AS CHAR)));
		ELSEIF numero>=99999 and numero<=999999 then
			set numero=numero+1;
		SET NEW.codigo_credito=(select concat('CRED00',CAST(numero AS CHAR)));
		ELSEIF numero>=999999 and numero<=9999999 then
			set numero=numero+1;
		SET NEW.codigo_credito=(select concat('CRED0',CAST(numero AS CHAR)));
        ELSEIF numero>=9999999  then 			set numero=numero+1;
		SET NEW.codigo_credito=(select concat('CRED',CAST(numero AS CHAR)));
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `currency`
--

CREATE TABLE `currency` (
  `idcurrency` int(11) NOT NULL,
  `CurrencyISO` varchar(3) DEFAULT NULL,
  `Language` varchar(3) DEFAULT NULL,
  `CurrencyName` varchar(35) DEFAULT NULL,
  `Money` varchar(30) DEFAULT NULL,
  `Symbol` varchar(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalleapartado`
--

CREATE TABLE `detalleapartado` (
  `idapartado` int(11) NOT NULL,
  `idproducto` int(11) NOT NULL,
  `cantidad` decimal(8,2) NOT NULL,
  `precio_unitario` decimal(8,2) NOT NULL,
  `fecha_vence` date DEFAULT NULL,
  `exento` decimal(8,2) NOT NULL,
  `descuento` decimal(8,2) NOT NULL,
  `importe` decimal(8,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detallecompra`
--

CREATE TABLE `detallecompra` (
  `idcompra` int(11) NOT NULL,
  `idproducto` int(11) NOT NULL,
  `fecha_vence` date DEFAULT NULL,
  `cantidad` decimal(8,2) NOT NULL,
  `precio_unitario` decimal(8,2) NOT NULL,
  `exento` decimal(8,2) NOT NULL,
  `importe` decimal(8,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detallecotizacion`
--

CREATE TABLE `detallecotizacion` (
  `idcotizacion` int(11) NOT NULL,
  `idproducto` int(11) NOT NULL,
  `cantidad` decimal(8,2) NOT NULL,
  `disponible` tinyint(1) NOT NULL,
  `precio_unitario` decimal(8,2) NOT NULL,
  `exento` decimal(8,2) NOT NULL,
  `descuento` decimal(8,2) NOT NULL,
  `importe` decimal(8,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalleventa`
--

CREATE TABLE `detalleventa` (
  `idventa` int(11) NOT NULL,
  `idproducto` int(11) NOT NULL,
  `cantidad` decimal(8,2) NOT NULL,
  `precio_unitario` decimal(8,2) NOT NULL,
  `fecha_vence` date DEFAULT NULL,
  `exento` decimal(8,2) NOT NULL,
  `descuento` decimal(8,2) NOT NULL,
  `importe` decimal(8,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `detalleventa`
--
DELIMITER $$
CREATE TRIGGER `tr_actualizar_stock_venta` AFTER INSERT ON `detalleventa` FOR EACH ROW BEGIN
    UPDATE `producto` 
    SET `stock` = `stock` - NEW.cantidad
    WHERE `idproducto` = NEW.idproducto;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_devolver_stock_venta` AFTER DELETE ON `detalleventa` FOR EACH ROW BEGIN
    UPDATE `producto` 
    SET `stock` = `stock` + OLD.cantidad
    WHERE `idproducto` = OLD.idproducto;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleado`
--

CREATE TABLE `empleado` (
  `idempleado` int(11) NOT NULL,
  `codigo_empleado` varchar(175) DEFAULT NULL,
  `nombre_empleado` varchar(90) NOT NULL,
  `apellido_empleado` varchar(90) NOT NULL,
  `telefono_empleado` varchar(70) NOT NULL,
  `email_empleado` varchar(80) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `empleado`
--
DELIMITER $$
CREATE TRIGGER `generar_codigo_empleado` BEFORE INSERT ON `empleado` FOR EACH ROW BEGIN
        DECLARE numero INT;
        SET numero = (SELECT max(idempleado) FROM empleado);
		IF numero IS NULL then
		  set numero=1;
        SET NEW.codigo_empleado='EM00000001';
		ELSEIF numero >= 1 and numero < 9 then
			set numero=numero+1;
		SET NEW.codigo_empleado=(select concat('EM0000000',CAST(numero AS CHAR)));
		ELSEIF numero >=9 and numero<=99 then
			set numero=numero+1;
		SET NEW.codigo_empleado=(select concat('EM000000',CAST(numero AS CHAR)));
		ELSEIF numero>=99 and numero<=999 then
			set numero=numero+1;
		SET NEW.codigo_empleado=(select concat('EM00000',CAST(numero AS CHAR)));
		ELSEIF numero>=999 and numero<=9999 then
		   set numero=numero+1;
		SET NEW.codigo_empleado=(select concat('EM0000',CAST(numero AS CHAR)));
		ELSEIF numero>=9999 and numero<=99999 then
			set numero=numero+1;
		SET NEW.codigo_empleado=(select concat('EM000',CAST(numero AS CHAR)));
		ELSEIF numero>=99999 and numero<=999999 then
			set numero=numero+1;
		SET NEW.codigo_empleado=(select concat('EM00',CAST(numero AS CHAR)));
		ELSEIF numero>=999999 and numero<=9999999 then
			set numero=numero+1;
		SET NEW.codigo_empleado=(select concat('EM0',CAST(numero AS CHAR)));
        ELSEIF numero>=9999999  then 			set numero=numero+1;
		SET NEW.codigo_empleado=(select concat('EM',CAST(numero AS CHAR)));
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `entrada`
--

CREATE TABLE `entrada` (
  `identrada` int(11) NOT NULL,
  `mes_inventario` varchar(7) NOT NULL,
  `fecha_entrada` date NOT NULL,
  `descripcion_entrada` varchar(150) NOT NULL,
  `cantidad_entrada` decimal(8,2) NOT NULL,
  `precio_unitario_entrada` decimal(8,2) NOT NULL,
  `costo_total_entrada` decimal(8,2) NOT NULL,
  `idproducto` int(11) NOT NULL,
  `idcompra` int(11) DEFAULT NULL,
  `idapartado` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventoscalendar`
--

CREATE TABLE `eventoscalendar` (
  `id` int(11) NOT NULL,
  `evento` varchar(250) DEFAULT NULL,
  `color_evento` varchar(20) DEFAULT NULL,
  `fecha_inicio` varchar(20) DEFAULT NULL,
  `fecha_fin` varchar(20) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `color` varchar(7) DEFAULT NULL,
  `start` datetime NOT NULL,
  `end` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_ediciones`
--

CREATE TABLE `historial_ediciones` (
  `idhistorial` int(11) NOT NULL,
  `idventa` int(11) NOT NULL,
  `fecha_edicion` datetime NOT NULL,
  `idusuario` int(11) NOT NULL,
  `accion` varchar(50) NOT NULL,
  `total_anterior` decimal(8,2) DEFAULT 0.00,
  `total_nuevo` decimal(8,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario`
--

CREATE TABLE `inventario` (
  `mes_inventario` varchar(7) DEFAULT NULL,
  `fecha_apertura` date NOT NULL,
  `fecha_cierre` date NOT NULL,
  `saldo_inicial` decimal(8,2) NOT NULL,
  `entradas` decimal(8,2) DEFAULT NULL,
  `salidas` decimal(8,2) DEFAULT NULL,
  `saldo_final` decimal(8,2) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  `idproducto` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marca`
--

CREATE TABLE `marca` (
  `idmarca` int(11) NOT NULL,
  `nombre_marca` varchar(120) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ordentaller`
--

CREATE TABLE `ordentaller` (
  `idorden` int(11) NOT NULL,
  `numero_orden` varchar(175) DEFAULT NULL,
  `fecha_ingreso` datetime NOT NULL,
  `idcliente` int(11) NOT NULL,
  `aparato` varchar(125) NOT NULL,
  `modelo` varchar(125) DEFAULT NULL,
  `idmarca` int(11) NOT NULL,
  `serie` varchar(125) DEFAULT NULL,
  `idtecnico` int(11) NOT NULL,
  `averia` varchar(200) NOT NULL,
  `observaciones` varchar(200) DEFAULT NULL,
  `deposito_revision` decimal(8,2) NOT NULL DEFAULT 0.00,
  `deposito_reparacion` decimal(8,2) DEFAULT 0.00,
  `diagnostico` varchar(200) NOT NULL,
  `estado_aparato` varchar(200) NOT NULL,
  `repuestos` decimal(8,2) NOT NULL DEFAULT 0.00,
  `mano_obra` decimal(8,2) DEFAULT 0.00,
  `fecha_alta` datetime DEFAULT NULL,
  `fecha_retiro` datetime DEFAULT NULL,
  `ubicacion` varchar(150) DEFAULT NULL,
  `parcial_pagar` decimal(8,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `ordentaller`
--
DELIMITER $$
CREATE TRIGGER `generar_codigo_ordentaller` BEFORE INSERT ON `ordentaller` FOR EACH ROW BEGIN
        DECLARE numero INT;
        SET numero = (SELECT max(idorden) FROM ordentaller);
		IF numero IS NULL then
		  set numero=1;
        SET NEW.numero_orden ='00000001';
		ELSEIF numero >= 1 and numero < 9 then
			set numero=numero+1;
		SET NEW.numero_orden =(select concat('0000000',CAST(numero AS CHAR)));
		ELSEIF numero >=9 and numero<=99 then
			set numero=numero+1;
		SET NEW.numero_orden =(select concat('000000',CAST(numero AS CHAR)));
		ELSEIF numero>=99 and numero<=999 then
			set numero=numero+1;
		SET NEW.numero_orden =(select concat('00000',CAST(numero AS CHAR)));
		ELSEIF numero>=999 and numero<=9999 then
		   set numero=numero+1;
		SET NEW.numero_orden =(select concat('0000',CAST(numero AS CHAR)));
		ELSEIF numero>=9999 and numero<=99999 then
			set numero=numero+1;
		SET NEW.numero_orden =(select concat('000',CAST(numero AS CHAR)));
		ELSEIF numero>=99999 and numero<=999999 then
			set numero=numero+1;
		SET NEW.numero_orden =(select concat('00',CAST(numero AS CHAR)));
		ELSEIF numero>=999999 and numero<=9999999 then
			set numero=numero+1;
		SET NEW.numero_orden =(select concat('0',CAST(numero AS CHAR)));
        ELSEIF numero>=9999999  then 			set numero=numero+1;
		SET NEW.numero_orden =(numero);
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `parametro`
--

CREATE TABLE `parametro` (
  `idparametro` int(11) NOT NULL,
  `nombre_empresa` varchar(150) NOT NULL,
  `propietario` varchar(150) NOT NULL,
  `numero_nit` varchar(70) NOT NULL,
  `numero_nrc` varchar(70) DEFAULT NULL,
  `porcentaje_iva` decimal(8,2) NOT NULL,
  `porcentaje_retencion` decimal(8,2) DEFAULT NULL,
  `monto_retencion` decimal(8,2) DEFAULT NULL,
  `direccion_empresa` varchar(200) NOT NULL,
  `logo_empresa` varchar(90) DEFAULT NULL,
  `idcurrency` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `perecedero`
--

CREATE TABLE `perecedero` (
  `fecha_vencimiento` date NOT NULL,
  `cantidad_perecedero` decimal(8,2) NOT NULL,
  `idproducto` int(11) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `presentacion`
--

CREATE TABLE `presentacion` (
  `idpresentacion` int(11) NOT NULL,
  `nombre_presentacion` varchar(120) NOT NULL,
  `siglas` varchar(45) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto`
--

CREATE TABLE `producto` (
  `idproducto` int(11) NOT NULL,
  `codigo_interno` varchar(175) DEFAULT NULL,
  `codigo_barra` varchar(200) DEFAULT NULL,
  `nombre_producto` varchar(175) NOT NULL,
  `precio_compra` decimal(8,2) NOT NULL,
  `precio_venta` decimal(8,2) NOT NULL,
  `precio_venta_mayoreo` decimal(8,2) NOT NULL,
  `precio_venta_3` decimal(8,2) NOT NULL DEFAULT 0.00,
  `stock` decimal(8,2) NOT NULL DEFAULT 0.00,
  `stock_min` decimal(8,2) NOT NULL DEFAULT 1.00,
  `idcategoria` int(11) NOT NULL,
  `idmarca` int(11) DEFAULT NULL,
  `idpresentacion` int(11) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  `exento` tinyint(1) NOT NULL DEFAULT 0,
  `inventariable` tinyint(1) NOT NULL DEFAULT 1,
  `perecedero` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `producto`
--
DELIMITER $$
CREATE TRIGGER `generar_codigo_producto` BEFORE INSERT ON `producto` FOR EACH ROW BEGIN
        DECLARE numero INT;
        SET numero = (SELECT max(idproducto) FROM producto);
		IF numero IS NULL then
		  set numero=1;
        SET NEW.codigo_interno='PR00000001';
		ELSEIF numero >= 1 and numero < 9 then
			set numero=numero+1;
		SET NEW.codigo_interno=(select concat('PR0000000',CAST(numero AS CHAR)));
		ELSEIF numero >=9 and numero<=99 then
			set numero=numero+1;
		SET NEW.codigo_interno=(select concat('PR000000',CAST(numero AS CHAR)));
		ELSEIF numero>=99 and numero<=999 then
			set numero=numero+1;
		SET NEW.codigo_interno=(select concat('PR00000',CAST(numero AS CHAR)));
		ELSEIF numero>=999 and numero<=9999 then
		   set numero=numero+1;
		SET NEW.codigo_interno=(select concat('PR0000',CAST(numero AS CHAR)));
		ELSEIF numero>=9999 and numero<=99999 then
			set numero=numero+1;
		SET NEW.codigo_interno=(select concat('PR000',CAST(numero AS CHAR)));
		ELSEIF numero>=99999 and numero<=999999 then
			set numero=numero+1;
		SET NEW.codigo_interno=(select concat('PR00',CAST(numero AS CHAR)));
		ELSEIF numero>=999999 and numero<=9999999 then
			set numero=numero+1;
		SET NEW.codigo_interno=(select concat('PR0',CAST(numero AS CHAR)));
        ELSEIF numero>=9999999  then 			set numero=numero+1;
		SET NEW.codigo_interno=(select concat('PR',CAST(numero AS CHAR)));
		END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `insertar_nuevo_producto_inventario` AFTER INSERT ON `producto` FOR EACH ROW BEGIN
    DECLARE p_idproducto INT;
    DECLARE p_stock INT;
    DECLARE p_precio DECIMAL(8,2);
    DECLARE p_costo_total DECIMAL(8,2);
	SET p_idproducto = (SELECT MAX(idproducto) FROM producto);
    SET p_stock = (SELECT stock FROM producto WHERE idproducto = p_idproducto);
    SET p_precio = (SELECT precio_compra FROM producto WHERE idproducto = p_idproducto);
    SET p_costo_total = p_stock * p_precio;
    INSERT INTO inventario (mes_inventario,fecha_apertura,fecha_cierre,saldo_inicial,entradas,salidas,saldo_final,estado,idproducto)
    SELECT DATE_FORMAT(CURDATE(),'%Y-%m'),DATE_FORMAT(CURDATE(),'%Y-%m-01'),LAST_DAY(CURDATE()),p_stock,p_stock,0,p_stock,1,p_idproducto;
    INSERT INTO entrada (mes_inventario,fecha_entrada,descripcion_entrada,
    cantidad_entrada,precio_unitario_entrada,costo_total_entrada,idproducto,idcompra)
    VALUES (DATE_FORMAT(CURDATE(),'%Y-%m'),CURDATE(),'INVENTARIO INICIAL',p_stock,p_precio,
    p_costo_total,p_idproducto,NULL);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto_proveedor`
--

CREATE TABLE `producto_proveedor` (
  `idproveedor` int(11) NOT NULL,
  `idproducto` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedor`
--

CREATE TABLE `proveedor` (
  `idproveedor` int(11) NOT NULL,
  `codigo_proveedor` varchar(175) DEFAULT NULL,
  `nombre_proveedor` varchar(175) NOT NULL,
  `numero_telefono` varchar(70) NOT NULL,
  `numero_nit` varchar(70) NOT NULL,
  `numero_nrc` varchar(70) NOT NULL,
  `nombre_contacto` varchar(150) DEFAULT NULL,
  `telefono_contacto` varchar(150) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `proveedor`
--
DELIMITER $$
CREATE TRIGGER `generar_codigo_proveedor` BEFORE INSERT ON `proveedor` FOR EACH ROW BEGIN
        DECLARE numero INT;
        SET numero = (SELECT max(idproveedor) FROM proveedor);
		IF numero IS NULL then
		  set numero=1;
        SET NEW.codigo_proveedor ='PROV00000001';
		ELSEIF numero >= 1 and numero < 9 then
			set numero=numero+1;
		SET NEW.codigo_proveedor =(select concat('PROV0000000',CAST(numero AS CHAR)));
		ELSEIF numero >=9 and numero<=99 then
			set numero=numero+1;
		SET NEW.codigo_proveedor =(select concat('PROV000000',CAST(numero AS CHAR)));
		ELSEIF numero>=99 and numero<=999 then
			set numero=numero+1;
		SET NEW.codigo_proveedor =(select concat('PROV00000',CAST(numero AS CHAR)));
		ELSEIF numero>=999 and numero<=9999 then
		   set numero=numero+1;
		SET NEW.codigo_proveedor =(select concat('PROV0000',CAST(numero AS CHAR)));
		ELSEIF numero>=9999 and numero<=99999 then
			set numero=numero+1;
		SET NEW.codigo_proveedor =(select concat('PROV000',CAST(numero AS CHAR)));
		ELSEIF numero>=99999 and numero<=999999 then
			set numero=numero+1;
		SET NEW.codigo_proveedor =(select concat('PROV00',CAST(numero AS CHAR)));
		ELSEIF numero>=999999 and numero<=9999999 then
			set numero=numero+1;
		SET NEW.codigo_proveedor =(select concat('PROV0',CAST(numero AS CHAR)));
        ELSEIF numero>=9999999  then 			set numero=numero+1;
		SET NEW.codigo_proveedor =(select concat('PROV',CAST(numero AS CHAR)));
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedor_precio`
--

CREATE TABLE `proveedor_precio` (
  `idproveedor` int(11) NOT NULL,
  `idproducto` int(11) NOT NULL,
  `fecha_precio` date NOT NULL,
  `precio_compra` decimal(8,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `prueba`
--

CREATE TABLE `prueba` (
  `id` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `telefono` text NOT NULL,
  `fecha` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `salida`
--

CREATE TABLE `salida` (
  `idsalida` int(11) NOT NULL,
  `mes_inventario` varchar(7) NOT NULL,
  `fecha_salida` date NOT NULL,
  `descripcion_salida` varchar(150) NOT NULL,
  `cantidad_salida` decimal(8,2) NOT NULL,
  `precio_unitario_salida` decimal(8,2) NOT NULL,
  `costo_total_salida` decimal(8,2) NOT NULL,
  `idproducto` int(11) NOT NULL,
  `idventa` int(11) DEFAULT NULL,
  `idapartado` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tecnico`
--

CREATE TABLE `tecnico` (
  `idtecnico` int(11) NOT NULL,
  `tecnico` varchar(150) NOT NULL,
  `telefono` varchar(70) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tiraje_comprobante`
--

CREATE TABLE `tiraje_comprobante` (
  `idtiraje` int(11) NOT NULL,
  `fecha_resolucion` datetime NOT NULL,
  `numero_resolucion` varchar(100) DEFAULT NULL,
  `serie` varchar(175) NOT NULL,
  `desde` int(11) NOT NULL,
  `hasta` int(11) NOT NULL,
  `idcomprobante` int(11) NOT NULL,
  `disponibles` int(11) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `idusuario` int(11) NOT NULL,
  `usuario` varchar(8) NOT NULL,
  `contrasena` varchar(180) NOT NULL,
  `tipo_usuario` tinyint(1) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  `idempleado` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta`
--

CREATE TABLE `venta` (
  `idventa` int(11) NOT NULL,
  `numero_venta` varchar(175) DEFAULT NULL,
  `fecha_venta` datetime NOT NULL,
  `tipo_pago` varchar(75) NOT NULL,
  `numero_comprobante` int(11) NOT NULL,
  `tipo_comprobante` tinyint(1) NOT NULL,
  `sumas` decimal(8,2) NOT NULL,
  `iva` decimal(8,2) NOT NULL,
  `exento` decimal(8,2) NOT NULL,
  `retenido` decimal(8,2) NOT NULL,
  `descuento` decimal(8,2) NOT NULL,
  `total` decimal(8,2) NOT NULL,
  `sonletras` varchar(150) NOT NULL,
  `pago_efectivo` decimal(8,2) NOT NULL DEFAULT 0.00,
  `pago_tarjeta` decimal(8,2) NOT NULL DEFAULT 0.00,
  `numero_tarjeta` varchar(16) DEFAULT NULL,
  `tarjeta_habiente` varchar(90) DEFAULT NULL,
  `cambio` decimal(8,2) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  `idcliente` int(11) DEFAULT NULL,
  `idusuario` int(11) NOT NULL,
  `notas` varchar(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `venta`
--
DELIMITER $$
CREATE TRIGGER `generar_numero_venta` BEFORE INSERT ON `venta` FOR EACH ROW BEGIN
        DECLARE numero INT(11);
        SET numero = (SELECT max(idventa) FROM venta);
		IF numero IS NULL then
		  set numero=1;
        SET NEW.numero_venta='0000000';
		ELSEIF numero >= 1 and numero < 9 then
			set numero=numero+1;
		SET NEW.numero_venta=(select concat('0000000',CAST(numero AS CHAR)));
		ELSEIF numero >=9 and numero<=99 then
			set numero=numero+1;
		SET NEW.numero_venta=(select concat('000000',CAST(numero AS CHAR)));
		ELSEIF numero>=99 and numero<=999 then
			set numero=numero+1;
		SET NEW.numero_venta=(select concat('00000',CAST(numero AS CHAR)));
		ELSEIF numero>=999 and numero<=9999 then
		   set numero=numero+1;
		SET NEW.numero_venta=(select concat('0000',CAST(numero AS CHAR)));
		ELSEIF numero>=9999 and numero<=99999 then
			set numero=numero+1;
		SET NEW.numero_venta=(select concat('000',CAST(numero AS CHAR)));
		ELSEIF numero>=99999 and numero<=999999 then
			set numero=numero+1;
		SET NEW.numero_venta=(select concat('00',CAST(numero AS CHAR)));
		ELSEIF numero>=999999 and numero<=9999999 then
			set numero=numero+1;
		SET NEW.numero_venta=(select concat('0',CAST(numero AS CHAR)));
        ELSEIF numero>=9999999  then 			set numero=numero+1;
		SET NEW.numero_venta=(select concat('0',CAST(numero AS CHAR)));
		END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_abonos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_abonos` (
`idcredito` int(11)
,`codigo_credito` varchar(175)
,`nombre_credito` varchar(120)
,`idabono` int(11)
,`fecha_abono` datetime
,`monto_abono` decimal(8,2)
,`restante_credito` decimal(8,2)
,`total_abonado` decimal(8,2)
,`idusuario` int(11)
,`usuario` varchar(8)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_apartados`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_apartados` (
`idapartado` int(11)
,`numero_apartado` varchar(175)
,`fecha_apartado` datetime
,`fecha_limite_retiro` datetime
,`sumas` decimal(8,2)
,`iva` decimal(8,2)
,`total_exento` decimal(8,2)
,`retenido` decimal(8,2)
,`total_descuento` decimal(8,2)
,`total` decimal(8,2)
,`sonletras` varchar(150)
,`estado_apartado` tinyint(1)
,`idcliente` int(11)
,`cliente` varchar(150)
,`idproducto` int(11)
,`codigo_barra` varchar(200)
,`codigo_interno` varchar(175)
,`nombre_producto` varchar(175)
,`nombre_marca` varchar(120)
,`siglas` varchar(45)
,`producto_exento` tinyint(1)
,`perecedero` tinyint(1)
,`fecha_vence` date
,`cantidad` decimal(8,2)
,`precio_unitario` decimal(8,2)
,`precio_compra` decimal(8,2)
,`exento` decimal(8,2)
,`descuento` decimal(8,2)
,`importe` decimal(8,2)
,`empleado` varchar(181)
,`abonado_apartado` decimal(8,2)
,`restante_pagar` decimal(8,2)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_caja`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_caja` (
`idcaja` int(11)
,`fecha_apertura` datetime
,`monto_apertura` decimal(8,2)
,`monto_cierre` decimal(8,2)
,`fecha_cierre` datetime
,`estado` tinyint(1)
,`tipo_movimiento` tinyint(1)
,`monto_movimiento` decimal(8,2)
,`descripcion_movimiento` varchar(80)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_compras`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_compras` (
`idcompra` int(11)
,`fecha_compra` datetime
,`idproveedor` int(11)
,`nombre_proveedor` varchar(175)
,`numero_nit` varchar(70)
,`tipo_pago` varchar(75)
,`tipo_comprobante` varchar(60)
,`numero_comprobante` varchar(60)
,`fecha_comprobante` date
,`idproducto` int(11)
,`fecha_vence` date
,`codigo_barra` varchar(200)
,`codigo_interno` varchar(175)
,`nombre_producto` varchar(175)
,`nombre_marca` varchar(120)
,`siglas` varchar(45)
,`cantidad` decimal(8,2)
,`precio_unitario` decimal(8,2)
,`exento` decimal(8,2)
,`importe` decimal(8,2)
,`sumas` decimal(8,2)
,`iva` decimal(8,2)
,`total_exento` decimal(8,2)
,`retenido` decimal(8,2)
,`total` decimal(8,2)
,`sonletras` varchar(150)
,`estado_compra` tinyint(1)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_comprobantes`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_comprobantes` (
`idcomprobante` int(11)
,`nombre_comprobante` varchar(75)
,`estado` tinyint(1)
,`idtiraje` int(11)
,`fecha_resolucion` datetime
,`serie` varchar(175)
,`numero_resolucion` varchar(100)
,`desde` int(11)
,`hasta` int(11)
,`disponibles` int(11)
,`siguiente_numero` bigint(13)
,`usados` bigint(12)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_cotizaciones`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_cotizaciones` (
`idcotizacion` int(11)
,`numero_cotizacion` varchar(175)
,`fecha_cotizacion` datetime
,`a_nombre` varchar(175)
,`nombre_cliente` varchar(150)
,`numero_nit` varchar(70)
,`direccion_cliente` varchar(100)
,`numero_telefono` varchar(70)
,`email` varchar(80)
,`tipo_pago` varchar(60)
,`entrega` varchar(60)
,`idproducto` int(11)
,`codigo_barra` varchar(200)
,`codigo_interno` varchar(175)
,`nombre_producto` varchar(175)
,`nombre_marca` varchar(120)
,`siglas` varchar(45)
,`stock` decimal(8,2)
,`cantidad` decimal(8,2)
,`disponible` tinyint(1)
,`precio_unitario` decimal(8,2)
,`exento` decimal(8,2)
,`descuento` decimal(8,2)
,`importe` decimal(8,2)
,`sumas` decimal(8,2)
,`iva` decimal(8,2)
,`total_exento` decimal(8,2)
,`retenido` decimal(8,2)
,`total_descuento` decimal(8,2)
,`total` decimal(8,2)
,`sonletras` varchar(150)
,`empleado` varchar(181)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_creditos_venta`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_creditos_venta` (
`idcredito` int(11)
,`codigo_credito` varchar(175)
,`idventa` int(11)
,`numero_venta` varchar(175)
,`nombre_credito` varchar(120)
,`fecha_credito` datetime
,`monto_credito` decimal(8,2)
,`monto_abonado` decimal(8,2)
,`monto_restante` decimal(8,2)
,`estado_credito` tinyint(1)
,`codigo_cliente` varchar(175)
,`cliente` varchar(150)
,`limite_credito` decimal(8,2)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_full_entradas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_full_entradas` (
`idproducto` int(11)
,`codigo_interno` varchar(175)
,`codigo_barra` varchar(200)
,`nombre_producto` varchar(175)
,`nombre_marca` varchar(120)
,`siglas` varchar(45)
,`fecha_entrada` date
,`descripcion_entrada` varchar(150)
,`cantidad_entrada` decimal(8,2)
,`precio_unitario_entrada` decimal(8,2)
,`costo_total_entrada` decimal(8,2)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_full_salidas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_full_salidas` (
`idproducto` int(11)
,`codigo_interno` varchar(175)
,`codigo_barra` varchar(200)
,`nombre_producto` varchar(175)
,`nombre_marca` varchar(120)
,`siglas` varchar(45)
,`fecha_salida` date
,`descripcion_salida` varchar(150)
,`cantidad_salida` decimal(8,2)
,`precio_unitario_salida` decimal(8,2)
,`costo_total_salida` decimal(8,2)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_historico_precios`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_historico_precios` (
`idproducto` int(11)
,`codigo_interno` varchar(175)
,`codigo_barra` varchar(200)
,`nombre_producto` varchar(175)
,`nombre_marca` varchar(120)
,`siglas` varchar(45)
,`idproveedor` int(11)
,`nombre_proveedor` varchar(175)
,`fecha_precio` date
,`precio_comprado` decimal(8,2)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_kardex`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_kardex` (
`idproducto` int(11)
,`producto` varchar(222)
,`nombre_marca` varchar(120)
,`saldo_inicial` decimal(8,2)
,`entradas` decimal(8,2)
,`salidas` decimal(8,2)
,`saldo_final` decimal(8,2)
,`mes_inventario` varchar(7)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_perecederos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_perecederos` (
`idproducto` int(11)
,`codigo_interno` varchar(175)
,`codigo_barra` varchar(200)
,`nombre_producto` varchar(175)
,`nombre_marca` varchar(120)
,`siglas` varchar(45)
,`fecha_vencimiento` date
,`cantidad_perecedero` decimal(8,2)
,`estado_perecedero` tinyint(1)
,`vencido` varchar(2)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_productos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_productos` (
`idproducto` int(11)
,`codigo_interno` varchar(175)
,`codigo_barra` varchar(200)
,`nombre_producto` varchar(175)
,`precio_compra` decimal(8,2)
,`precio_venta` decimal(8,2)
,`precio_venta_mayoreo` decimal(8,2)
,`precio_venta_3` decimal(8,2)
,`stock` decimal(8,2)
,`stock_min` decimal(8,2)
,`idcategoria` int(11)
,`nombre_categoria` varchar(120)
,`idmarca` int(11)
,`nombre_marca` varchar(120)
,`idpresentacion` int(11)
,`nombre_presentacion` varchar(120)
,`siglas` varchar(45)
,`estado` tinyint(1)
,`exento` tinyint(1)
,`inventariable` tinyint(1)
,`perecedero` tinyint(1)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_productos_apartado`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_productos_apartado` (
`idproducto` int(11)
,`codigo_interno` varchar(175)
,`codigo_barra` varchar(200)
,`nombre_producto` varchar(175)
,`siglas` varchar(45)
,`nombre_marca` varchar(120)
,`precio_venta` decimal(8,2)
,`precio_venta_mayoreo` decimal(8,2)
,`stock` decimal(8,2)
,`exento` tinyint(1)
,`perecedero` tinyint(1)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_productos_cotizacion`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_productos_cotizacion` (
`idproducto` int(11)
,`codigo_interno` varchar(175)
,`codigo_barra` varchar(200)
,`nombre_producto` varchar(175)
,`siglas` varchar(45)
,`nombre_marca` varchar(120)
,`precio_venta` decimal(8,2)
,`precio_venta_mayoreo` decimal(8,2)
,`stock` decimal(8,2)
,`exento` tinyint(1)
,`perecedero` tinyint(1)
,`inventariable` tinyint(1)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_productos_venta`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_productos_venta` (
`idproducto` int(11)
,`codigo_interno` varchar(175)
,`codigo_barra` varchar(200)
,`nombre_producto` varchar(175)
,`siglas` varchar(45)
,`nombre_marca` varchar(120)
,`precio_venta` decimal(8,2)
,`precio_venta_mayoreo` decimal(8,2)
,`stock` decimal(8,2)
,`exento` tinyint(1)
,`perecedero` tinyint(1)
,`inventariable` tinyint(1)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_taller`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_taller` (
`idorden` int(11)
,`numero_orden` varchar(175)
,`fecha_ingreso` datetime
,`aparato` varchar(125)
,`modelo` varchar(125)
,`serie` varchar(125)
,`averia` varchar(200)
,`observaciones` varchar(200)
,`deposito_revision` decimal(8,2)
,`deposito_reparacion` decimal(8,2)
,`diagnostico` varchar(200)
,`estado_aparato` varchar(200)
,`repuestos` decimal(8,2)
,`mano_obra` decimal(8,2)
,`fecha_alta` datetime
,`fecha_retiro` datetime
,`ubicacion` varchar(150)
,`parcial_pagar` decimal(8,2)
,`idcliente` int(11)
,`nombre_cliente` varchar(150)
,`numero_nit` varchar(70)
,`numero_telefono` varchar(70)
,`idtecnico` int(11)
,`tecnico` varchar(150)
,`idmarca` int(11)
,`nombre_marca` varchar(120)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_usuarios`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_usuarios` (
`idusuario` int(11)
,`usuario` varchar(8)
,`contrasena` varchar(180)
,`tipo_usuario` tinyint(1)
,`estado` tinyint(1)
,`idempleado` int(11)
,`nombre_empleado` varchar(90)
,`apellido_empleado` varchar(90)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `view_ventas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `view_ventas` (
`idventa` int(11)
,`numero_venta` varchar(175)
,`fecha_venta` datetime
,`tipo_pago` varchar(75)
,`numero_comprobante` int(11)
,`tipo_comprobante` tinyint(1)
,`pago_efectivo` decimal(8,2)
,`pago_tarjeta` decimal(8,2)
,`numero_tarjeta` varchar(16)
,`tarjeta_habiente` varchar(90)
,`cambio` decimal(8,2)
,`sumas` decimal(8,2)
,`iva` decimal(8,2)
,`total_exento` decimal(8,2)
,`retenido` decimal(8,2)
,`total_descuento` decimal(8,2)
,`total` decimal(8,2)
,`sonletras` varchar(150)
,`estado_venta` tinyint(1)
,`idcliente` int(11)
,`notas` varchar(120)
,`cliente` varchar(150)
,`rtnC` varchar(70)
,`telefonoC` varchar(70)
,`direccionC` varchar(100)
,`idproducto` int(11)
,`codigo_barra` varchar(200)
,`codigo_interno` varchar(175)
,`nombre_producto` varchar(175)
,`nombre_marca` varchar(120)
,`siglas` varchar(45)
,`producto_exento` tinyint(1)
,`perecedero` tinyint(1)
,`fecha_vence` date
,`cantidad` decimal(8,2)
,`precio_unitario` decimal(8,2)
,`precio_compra` decimal(8,2)
,`exento` decimal(8,2)
,`descuento` decimal(8,2)
,`importe` decimal(8,2)
,`empleado` varchar(181)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `view_abonos`
--
DROP TABLE IF EXISTS `view_abonos`;

CREATE VIEW `view_abonos`  AS SELECT `view_creditos_venta`.`idcredito` AS `idcredito`, `view_creditos_venta`.`codigo_credito` AS `codigo_credito`, `view_creditos_venta`.`nombre_credito` AS `nombre_credito`, `abono`.`idabono` AS `idabono`, `abono`.`fecha_abono` AS `fecha_abono`, `abono`.`monto_abono` AS `monto_abono`, `abono`.`restante_credito` AS `restante_credito`, `abono`.`total_abonado` AS `total_abonado`, `abono`.`idusuario` AS `idusuario`, `view_usuarios`.`usuario` AS `usuario` FROM ((`abono` join `view_creditos_venta` on(`view_creditos_venta`.`idcredito` = `abono`.`idcredito`)) join `view_usuarios` on(`abono`.`idusuario` = `view_usuarios`.`idusuario`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_apartados`
--
DROP TABLE IF EXISTS `view_apartados`;

CREATE VIEW `view_apartados`  AS SELECT `apartado`.`idapartado` AS `idapartado`, `apartado`.`numero_apartado` AS `numero_apartado`, `apartado`.`fecha_apartado` AS `fecha_apartado`, `apartado`.`fecha_limite_retiro` AS `fecha_limite_retiro`, `apartado`.`sumas` AS `sumas`, `apartado`.`iva` AS `iva`, `apartado`.`exento` AS `total_exento`, `apartado`.`retenido` AS `retenido`, `apartado`.`descuento` AS `total_descuento`, `apartado`.`total` AS `total`, `apartado`.`sonletras` AS `sonletras`, `apartado`.`estado` AS `estado_apartado`, `apartado`.`idcliente` AS `idcliente`, `cliente`.`nombre_cliente` AS `cliente`, `detalleapartado`.`idproducto` AS `idproducto`, `view_productos`.`codigo_barra` AS `codigo_barra`, `view_productos`.`codigo_interno` AS `codigo_interno`, `view_productos`.`nombre_producto` AS `nombre_producto`, `view_productos`.`nombre_marca` AS `nombre_marca`, `view_productos`.`siglas` AS `siglas`, `view_productos`.`exento` AS `producto_exento`, `view_productos`.`perecedero` AS `perecedero`, `detalleapartado`.`fecha_vence` AS `fecha_vence`, `detalleapartado`.`cantidad` AS `cantidad`, `detalleapartado`.`precio_unitario` AS `precio_unitario`, `view_productos`.`precio_compra` AS `precio_compra`, `detalleapartado`.`exento` AS `exento`, `detalleapartado`.`descuento` AS `descuento`, `detalleapartado`.`importe` AS `importe`, concat(`view_usuarios`.`nombre_empleado`,' ',`view_usuarios`.`apellido_empleado`) AS `empleado`, `apartado`.`abonado_apartado` AS `abonado_apartado`, `apartado`.`restante_pagar` AS `restante_pagar` FROM ((((`apartado` join `detalleapartado` on(`detalleapartado`.`idapartado` = `apartado`.`idapartado`)) join `view_productos` on(`detalleapartado`.`idproducto` = `view_productos`.`idproducto`)) join `view_usuarios` on(`view_usuarios`.`idusuario` = `apartado`.`idusuario`)) left join `cliente` on(`apartado`.`idcliente` = `cliente`.`idcliente`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_caja`
--
DROP TABLE IF EXISTS `view_caja`;

CREATE VIEW `view_caja`  AS SELECT `caja`.`idcaja` AS `idcaja`, `caja`.`fecha_apertura` AS `fecha_apertura`, `caja`.`monto_apertura` AS `monto_apertura`, `caja`.`monto_cierre` AS `monto_cierre`, `caja`.`fecha_cierre` AS `fecha_cierre`, `caja`.`estado` AS `estado`, `caja_movimiento`.`tipo_movimiento` AS `tipo_movimiento`, `caja_movimiento`.`monto_movimiento` AS `monto_movimiento`, `caja_movimiento`.`descripcion_movimiento` AS `descripcion_movimiento` FROM (`caja` join `caja_movimiento` on(`caja`.`idcaja` = `caja_movimiento`.`idcaja`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_compras`
--
DROP TABLE IF EXISTS `view_compras`;

CREATE VIEW `view_compras`  AS SELECT `compra`.`idcompra` AS `idcompra`, `compra`.`fecha_compra` AS `fecha_compra`, `compra`.`idproveedor` AS `idproveedor`, `proveedor`.`nombre_proveedor` AS `nombre_proveedor`, `proveedor`.`numero_nit` AS `numero_nit`, `compra`.`tipo_pago` AS `tipo_pago`, `compra`.`tipo_comprobante` AS `tipo_comprobante`, `compra`.`numero_comprobante` AS `numero_comprobante`, `compra`.`fecha_comprobante` AS `fecha_comprobante`, `detallecompra`.`idproducto` AS `idproducto`, `detallecompra`.`fecha_vence` AS `fecha_vence`, `producto`.`codigo_barra` AS `codigo_barra`, `producto`.`codigo_interno` AS `codigo_interno`, `producto`.`nombre_producto` AS `nombre_producto`, `marca`.`nombre_marca` AS `nombre_marca`, `presentacion`.`siglas` AS `siglas`, `detallecompra`.`cantidad` AS `cantidad`, `detallecompra`.`precio_unitario` AS `precio_unitario`, `detallecompra`.`exento` AS `exento`, `detallecompra`.`importe` AS `importe`, `compra`.`sumas` AS `sumas`, `compra`.`iva` AS `iva`, `compra`.`exento` AS `total_exento`, `compra`.`retenido` AS `retenido`, `compra`.`total` AS `total`, `compra`.`sonletras` AS `sonletras`, `compra`.`estado` AS `estado_compra` FROM (((((`compra` join `detallecompra` on(`compra`.`idcompra` = `detallecompra`.`idcompra`)) join `proveedor` on(`proveedor`.`idproveedor` = `compra`.`idproveedor`)) join `producto` on(`detallecompra`.`idproducto` = `producto`.`idproducto`)) join `presentacion` on(`producto`.`idpresentacion` = `presentacion`.`idpresentacion`)) left join `marca` on(`producto`.`idmarca` = `marca`.`idmarca`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_comprobantes`
--
DROP TABLE IF EXISTS `view_comprobantes`;

CREATE VIEW `view_comprobantes`  AS SELECT `c`.`idcomprobante` AS `idcomprobante`, `c`.`nombre_comprobante` AS `nombre_comprobante`, `c`.`estado` AS `estado`, `tc`.`idtiraje` AS `idtiraje`, `tc`.`fecha_resolucion` AS `fecha_resolucion`, `tc`.`serie` AS `serie`, `tc`.`numero_resolucion` AS `numero_resolucion`, `tc`.`desde` AS `desde`, `tc`.`hasta` AS `hasta`, `tc`.`disponibles` AS `disponibles`, coalesce(`tc`.`hasta` - `tc`.`disponibles` + 1,`tc`.`desde`) AS `siguiente_numero`, `tc`.`hasta`- `tc`.`disponibles` AS `usados` FROM (`comprobante` `c` join `tiraje_comprobante` `tc` on(`c`.`idcomprobante` = `tc`.`idcomprobante`)) WHERE `tc`.`activo` = 1 ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_cotizaciones`
--
DROP TABLE IF EXISTS `view_cotizaciones`;

CREATE VIEW `view_cotizaciones`  AS SELECT `cotizacion`.`idcotizacion` AS `idcotizacion`, `cotizacion`.`numero_cotizacion` AS `numero_cotizacion`, `cotizacion`.`fecha_cotizacion` AS `fecha_cotizacion`, `cotizacion`.`a_nombre` AS `a_nombre`, `cliente`.`nombre_cliente` AS `nombre_cliente`, `cliente`.`numero_nit` AS `numero_nit`, `cliente`.`direccion_cliente` AS `direccion_cliente`, `cliente`.`numero_telefono` AS `numero_telefono`, `cliente`.`email` AS `email`, `cotizacion`.`tipo_pago` AS `tipo_pago`, `cotizacion`.`entrega` AS `entrega`, `detallecotizacion`.`idproducto` AS `idproducto`, `producto`.`codigo_barra` AS `codigo_barra`, `producto`.`codigo_interno` AS `codigo_interno`, `producto`.`nombre_producto` AS `nombre_producto`, `marca`.`nombre_marca` AS `nombre_marca`, `presentacion`.`siglas` AS `siglas`, `producto`.`stock` AS `stock`, `detallecotizacion`.`cantidad` AS `cantidad`, `detallecotizacion`.`disponible` AS `disponible`, `detallecotizacion`.`precio_unitario` AS `precio_unitario`, `detallecotizacion`.`exento` AS `exento`, `detallecotizacion`.`descuento` AS `descuento`, `detallecotizacion`.`importe` AS `importe`, `cotizacion`.`sumas` AS `sumas`, `cotizacion`.`iva` AS `iva`, `cotizacion`.`exento` AS `total_exento`, `cotizacion`.`retenido` AS `retenido`, `cotizacion`.`descuento` AS `total_descuento`, `cotizacion`.`total` AS `total`, `cotizacion`.`sonletras` AS `sonletras`, concat(`view_usuarios`.`nombre_empleado`,' ',`view_usuarios`.`apellido_empleado`) AS `empleado` FROM ((((((`cotizacion` join `detallecotizacion` on(`cotizacion`.`idcotizacion` = `detallecotizacion`.`idcotizacion`)) join `producto` on(`detallecotizacion`.`idproducto` = `producto`.`idproducto`)) join `presentacion` on(`producto`.`idpresentacion` = `presentacion`.`idpresentacion`)) left join `marca` on(`producto`.`idmarca` = `marca`.`idmarca`)) join `view_usuarios` on(`cotizacion`.`idusuario` = `view_usuarios`.`idusuario`)) join `cliente` on(`cotizacion`.`idcliente` = `cliente`.`idcliente`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_creditos_venta`
--
DROP TABLE IF EXISTS `view_creditos_venta`;

CREATE VIEW `view_creditos_venta`  AS SELECT `credito`.`idcredito` AS `idcredito`, `credito`.`codigo_credito` AS `codigo_credito`, `credito`.`idventa` AS `idventa`, `venta`.`numero_venta` AS `numero_venta`, `credito`.`nombre_credito` AS `nombre_credito`, `credito`.`fecha_credito` AS `fecha_credito`, `credito`.`monto_credito` AS `monto_credito`, `credito`.`monto_abonado` AS `monto_abonado`, `credito`.`monto_restante` AS `monto_restante`, `credito`.`estado` AS `estado_credito`, `cliente`.`codigo_cliente` AS `codigo_cliente`, `cliente`.`nombre_cliente` AS `cliente`, `cliente`.`limite_credito` AS `limite_credito` FROM ((`credito` join `venta` on(`credito`.`idventa` = `venta`.`idventa`)) join `cliente` on(`credito`.`idcliente` = `cliente`.`idcliente`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_full_entradas`
--
DROP TABLE IF EXISTS `view_full_entradas`;

CREATE VIEW `view_full_entradas`  AS SELECT `entrada`.`idproducto` AS `idproducto`, `view_productos`.`codigo_interno` AS `codigo_interno`, `view_productos`.`codigo_barra` AS `codigo_barra`, `view_productos`.`nombre_producto` AS `nombre_producto`, `view_productos`.`nombre_marca` AS `nombre_marca`, `view_productos`.`siglas` AS `siglas`, `entrada`.`fecha_entrada` AS `fecha_entrada`, `entrada`.`descripcion_entrada` AS `descripcion_entrada`, `entrada`.`cantidad_entrada` AS `cantidad_entrada`, `entrada`.`precio_unitario_entrada` AS `precio_unitario_entrada`, `entrada`.`costo_total_entrada` AS `costo_total_entrada` FROM (`entrada` join `view_productos` on(`entrada`.`idproducto` = `view_productos`.`idproducto`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_full_salidas`
--
DROP TABLE IF EXISTS `view_full_salidas`;

CREATE VIEW `view_full_salidas`  AS SELECT `salida`.`idproducto` AS `idproducto`, `view_productos`.`codigo_interno` AS `codigo_interno`, `view_productos`.`codigo_barra` AS `codigo_barra`, `view_productos`.`nombre_producto` AS `nombre_producto`, `view_productos`.`nombre_marca` AS `nombre_marca`, `view_productos`.`siglas` AS `siglas`, `salida`.`fecha_salida` AS `fecha_salida`, `salida`.`descripcion_salida` AS `descripcion_salida`, `salida`.`cantidad_salida` AS `cantidad_salida`, `salida`.`precio_unitario_salida` AS `precio_unitario_salida`, `salida`.`costo_total_salida` AS `costo_total_salida` FROM (`salida` join `view_productos` on(`salida`.`idproducto` = `view_productos`.`idproducto`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_historico_precios`
--
DROP TABLE IF EXISTS `view_historico_precios`;

CREATE VIEW `view_historico_precios`  AS SELECT `proveedor_precio`.`idproducto` AS `idproducto`, `view_productos`.`codigo_interno` AS `codigo_interno`, `view_productos`.`codigo_barra` AS `codigo_barra`, `view_productos`.`nombre_producto` AS `nombre_producto`, `view_productos`.`nombre_marca` AS `nombre_marca`, `view_productos`.`siglas` AS `siglas`, `proveedor_precio`.`idproveedor` AS `idproveedor`, `proveedor`.`nombre_proveedor` AS `nombre_proveedor`, `proveedor_precio`.`fecha_precio` AS `fecha_precio`, `proveedor_precio`.`precio_compra` AS `precio_comprado` FROM ((`proveedor_precio` join `view_productos` on(`proveedor_precio`.`idproducto` = `view_productos`.`idproducto`)) join `proveedor` on(`proveedor_precio`.`idproveedor` = `proveedor`.`idproveedor`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_kardex`
--
DROP TABLE IF EXISTS `view_kardex`;

CREATE VIEW `view_kardex`  AS SELECT `inventario`.`idproducto` AS `idproducto`, concat(`view_productos`.`nombre_producto`,'  ',`view_productos`.`siglas`) AS `producto`, `view_productos`.`nombre_marca` AS `nombre_marca`, `inventario`.`saldo_inicial` AS `saldo_inicial`, if(`inventario`.`entradas` is null,0.00,`inventario`.`entradas`) AS `entradas`, if(`inventario`.`salidas` is null,0.00,`inventario`.`salidas`) AS `salidas`, `inventario`.`saldo_final` AS `saldo_final`, `inventario`.`mes_inventario` AS `mes_inventario` FROM (`inventario` join `view_productos` on(`inventario`.`idproducto` = `view_productos`.`idproducto`)) GROUP BY `inventario`.`idproducto`, `inventario`.`mes_inventario` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_perecederos`
--
DROP TABLE IF EXISTS `view_perecederos`;

CREATE VIEW `view_perecederos`  AS SELECT `perecedero`.`idproducto` AS `idproducto`, `producto`.`codigo_interno` AS `codigo_interno`, `producto`.`codigo_barra` AS `codigo_barra`, `producto`.`nombre_producto` AS `nombre_producto`, `marca`.`nombre_marca` AS `nombre_marca`, `presentacion`.`siglas` AS `siglas`, `perecedero`.`fecha_vencimiento` AS `fecha_vencimiento`, `perecedero`.`cantidad_perecedero` AS `cantidad_perecedero`, `perecedero`.`estado` AS `estado_perecedero`, if(curdate() < `perecedero`.`fecha_vencimiento`,'NO','SI') AS `vencido` FROM (((`perecedero` join `producto` on(`perecedero`.`idproducto` = `producto`.`idproducto`)) join `presentacion` on(`producto`.`idpresentacion` = `presentacion`.`idpresentacion`)) left join `marca` on(`producto`.`idmarca` = `marca`.`idmarca`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_productos`
--
DROP TABLE IF EXISTS `view_productos`;

CREATE VIEW `view_productos`  AS SELECT `p`.`idproducto` AS `idproducto`, `p`.`codigo_interno` AS `codigo_interno`, `p`.`codigo_barra` AS `codigo_barra`, `p`.`nombre_producto` AS `nombre_producto`, `p`.`precio_compra` AS `precio_compra`, `p`.`precio_venta` AS `precio_venta`, `p`.`precio_venta_mayoreo` AS `precio_venta_mayoreo`, `p`.`precio_venta_3` AS `precio_venta_3`, `p`.`stock` AS `stock`, `p`.`stock_min` AS `stock_min`, `p`.`idcategoria` AS `idcategoria`, `c`.`nombre_categoria` AS `nombre_categoria`, `p`.`idmarca` AS `idmarca`, `m`.`nombre_marca` AS `nombre_marca`, `p`.`idpresentacion` AS `idpresentacion`, `pre`.`nombre_presentacion` AS `nombre_presentacion`, `pre`.`siglas` AS `siglas`, `p`.`estado` AS `estado`, `p`.`exento` AS `exento`, `p`.`inventariable` AS `inventariable`, `p`.`perecedero` AS `perecedero` FROM (((`producto` `p` join `categoria` `c` on(`p`.`idcategoria` = `c`.`idcategoria`)) join `presentacion` `pre` on(`p`.`idpresentacion` = `pre`.`idpresentacion`)) left join `marca` `m` on(`p`.`idmarca` = `m`.`idmarca`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_productos_apartado`
--
DROP TABLE IF EXISTS `view_productos_apartado`;

CREATE VIEW `view_productos_apartado`  AS SELECT `view_productos`.`idproducto` AS `idproducto`, `view_productos`.`codigo_interno` AS `codigo_interno`, `view_productos`.`codigo_barra` AS `codigo_barra`, `view_productos`.`nombre_producto` AS `nombre_producto`, `view_productos`.`siglas` AS `siglas`, `view_productos`.`nombre_marca` AS `nombre_marca`, `view_productos`.`precio_venta` AS `precio_venta`, `view_productos`.`precio_venta_mayoreo` AS `precio_venta_mayoreo`, `view_productos`.`stock` AS `stock`, `view_productos`.`exento` AS `exento`, `view_productos`.`perecedero` AS `perecedero` FROM `view_productos` WHERE `view_productos`.`stock` > 0.00 AND `view_productos`.`precio_venta` > 0.00 AND `view_productos`.`estado` = 1 AND `view_productos`.`perecedero` = 0 AND `view_productos`.`inventariable` = 1 GROUP BY `view_productos`.`idproducto` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_productos_cotizacion`
--
DROP TABLE IF EXISTS `view_productos_cotizacion`;

CREATE VIEW `view_productos_cotizacion`  AS SELECT `view_productos`.`idproducto` AS `idproducto`, `view_productos`.`codigo_interno` AS `codigo_interno`, `view_productos`.`codigo_barra` AS `codigo_barra`, `view_productos`.`nombre_producto` AS `nombre_producto`, `view_productos`.`siglas` AS `siglas`, `view_productos`.`nombre_marca` AS `nombre_marca`, `view_productos`.`precio_venta` AS `precio_venta`, `view_productos`.`precio_venta_mayoreo` AS `precio_venta_mayoreo`, `view_productos`.`stock` AS `stock`, `view_productos`.`exento` AS `exento`, `view_productos`.`perecedero` AS `perecedero`, `view_productos`.`inventariable` AS `inventariable` FROM `view_productos` WHERE `view_productos`.`precio_venta` > 0.00 AND `view_productos`.`estado` = 1 AND `view_productos`.`inventariable` = 1 OR `view_productos`.`inventariable` = 0 GROUP BY `view_productos`.`idproducto` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_productos_venta`
--
DROP TABLE IF EXISTS `view_productos_venta`;

CREATE VIEW `view_productos_venta`  AS SELECT `view_productos`.`idproducto` AS `idproducto`, `view_productos`.`codigo_interno` AS `codigo_interno`, `view_productos`.`codigo_barra` AS `codigo_barra`, `view_productos`.`nombre_producto` AS `nombre_producto`, `view_productos`.`siglas` AS `siglas`, `view_productos`.`nombre_marca` AS `nombre_marca`, `view_productos`.`precio_venta` AS `precio_venta`, `view_productos`.`precio_venta_mayoreo` AS `precio_venta_mayoreo`, `view_productos`.`stock` AS `stock`, `view_productos`.`exento` AS `exento`, `view_productos`.`perecedero` AS `perecedero`, `view_productos`.`inventariable` AS `inventariable` FROM `view_productos` WHERE `view_productos`.`stock` > 0.00 AND `view_productos`.`precio_venta` > 0.00 AND `view_productos`.`estado` = 1 AND `view_productos`.`inventariable` = 1 OR `view_productos`.`inventariable` = 0 GROUP BY `view_productos`.`idproducto` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_taller`
--
DROP TABLE IF EXISTS `view_taller`;

CREATE VIEW `view_taller`  AS SELECT `ordentaller`.`idorden` AS `idorden`, `ordentaller`.`numero_orden` AS `numero_orden`, `ordentaller`.`fecha_ingreso` AS `fecha_ingreso`, `ordentaller`.`aparato` AS `aparato`, `ordentaller`.`modelo` AS `modelo`, `ordentaller`.`serie` AS `serie`, `ordentaller`.`averia` AS `averia`, `ordentaller`.`observaciones` AS `observaciones`, `ordentaller`.`deposito_revision` AS `deposito_revision`, `ordentaller`.`deposito_reparacion` AS `deposito_reparacion`, `ordentaller`.`diagnostico` AS `diagnostico`, `ordentaller`.`estado_aparato` AS `estado_aparato`, `ordentaller`.`repuestos` AS `repuestos`, `ordentaller`.`mano_obra` AS `mano_obra`, `ordentaller`.`fecha_alta` AS `fecha_alta`, `ordentaller`.`fecha_retiro` AS `fecha_retiro`, `ordentaller`.`ubicacion` AS `ubicacion`, `ordentaller`.`parcial_pagar` AS `parcial_pagar`, `ordentaller`.`idcliente` AS `idcliente`, `cliente`.`nombre_cliente` AS `nombre_cliente`, `cliente`.`numero_nit` AS `numero_nit`, `cliente`.`numero_telefono` AS `numero_telefono`, `ordentaller`.`idtecnico` AS `idtecnico`, `tecnico`.`tecnico` AS `tecnico`, `ordentaller`.`idmarca` AS `idmarca`, `marca`.`nombre_marca` AS `nombre_marca` FROM (((`ordentaller` join `cliente` on(`ordentaller`.`idcliente` = `cliente`.`idcliente`)) join `marca` on(`ordentaller`.`idmarca` = `marca`.`idmarca`)) join `tecnico` on(`ordentaller`.`idtecnico` = `tecnico`.`idtecnico`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_usuarios`
--
DROP TABLE IF EXISTS `view_usuarios`;

CREATE VIEW `view_usuarios`  AS SELECT `usuario`.`idusuario` AS `idusuario`, `usuario`.`usuario` AS `usuario`, `usuario`.`contrasena` AS `contrasena`, `usuario`.`tipo_usuario` AS `tipo_usuario`, `usuario`.`estado` AS `estado`, `usuario`.`idempleado` AS `idempleado`, `empleado`.`nombre_empleado` AS `nombre_empleado`, `empleado`.`apellido_empleado` AS `apellido_empleado` FROM (`usuario` join `empleado` on(`usuario`.`idempleado` = `empleado`.`idempleado`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `view_ventas`
--
DROP TABLE IF EXISTS `view_ventas`;

CREATE VIEW `view_ventas`  AS SELECT `venta`.`idventa` AS `idventa`, `venta`.`numero_venta` AS `numero_venta`, `venta`.`fecha_venta` AS `fecha_venta`, `venta`.`tipo_pago` AS `tipo_pago`, `venta`.`numero_comprobante` AS `numero_comprobante`, `venta`.`tipo_comprobante` AS `tipo_comprobante`, `venta`.`pago_efectivo` AS `pago_efectivo`, `venta`.`pago_tarjeta` AS `pago_tarjeta`, `venta`.`numero_tarjeta` AS `numero_tarjeta`, `venta`.`tarjeta_habiente` AS `tarjeta_habiente`, `venta`.`cambio` AS `cambio`, `venta`.`sumas` AS `sumas`, `venta`.`iva` AS `iva`, `venta`.`exento` AS `total_exento`, `venta`.`retenido` AS `retenido`, `venta`.`descuento` AS `total_descuento`, `venta`.`total` AS `total`, `venta`.`sonletras` AS `sonletras`, `venta`.`estado` AS `estado_venta`, `venta`.`idcliente` AS `idcliente`, `venta`.`notas` AS `notas`, `cliente`.`nombre_cliente` AS `cliente`, `cliente`.`numero_nit` AS `rtnC`, `cliente`.`numero_telefono` AS `telefonoC`, `cliente`.`direccion_cliente` AS `direccionC`, `detalleventa`.`idproducto` AS `idproducto`, `view_productos`.`codigo_barra` AS `codigo_barra`, `view_productos`.`codigo_interno` AS `codigo_interno`, `view_productos`.`nombre_producto` AS `nombre_producto`, `view_productos`.`nombre_marca` AS `nombre_marca`, `view_productos`.`siglas` AS `siglas`, `view_productos`.`exento` AS `producto_exento`, `view_productos`.`perecedero` AS `perecedero`, `detalleventa`.`fecha_vence` AS `fecha_vence`, `detalleventa`.`cantidad` AS `cantidad`, `detalleventa`.`precio_unitario` AS `precio_unitario`, `view_productos`.`precio_compra` AS `precio_compra`, `detalleventa`.`exento` AS `exento`, `detalleventa`.`descuento` AS `descuento`, `detalleventa`.`importe` AS `importe`, concat(`view_usuarios`.`nombre_empleado`,' ',`view_usuarios`.`apellido_empleado`) AS `empleado` FROM ((((`venta` join `detalleventa` on(`detalleventa`.`idventa` = `venta`.`idventa`)) join `view_productos` on(`detalleventa`.`idproducto` = `view_productos`.`idproducto`)) join `view_usuarios` on(`view_usuarios`.`idusuario` = `venta`.`idusuario`)) left join `cliente` on(`venta`.`idcliente` = `cliente`.`idcliente`)) ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `apartado`
--
ALTER TABLE `apartado`
  ADD PRIMARY KEY (`idapartado`),
  ADD UNIQUE KEY `numero_venta_UNIQUE` (`numero_apartado`),
  ADD KEY `fk_venta_cliente1_idx` (`idcliente`),
  ADD KEY `fk_venta_usuario1_idx` (`idusuario`);

--
-- Indices de la tabla `caja`
--
ALTER TABLE `caja`
  ADD PRIMARY KEY (`idcaja`);

--
-- Indices de la tabla `caja_movimiento`
--
ALTER TABLE `caja_movimiento`
  ADD KEY `fk_caja_movimiento_caja1_idx` (`idcaja`);

--
-- Indices de la tabla `categoria`
--
ALTER TABLE `categoria`
  ADD PRIMARY KEY (`idcategoria`);

--
-- Indices de la tabla `cliente`
--
ALTER TABLE `cliente`
  ADD PRIMARY KEY (`idcliente`),
  ADD UNIQUE KEY `codigo_cliente_UNIQUE` (`codigo_cliente`);

--
-- Indices de la tabla `compra`
--
ALTER TABLE `compra`
  ADD PRIMARY KEY (`idcompra`),
  ADD KEY `fk_compra_proveedor1_idx` (`idproveedor`);

--
-- Indices de la tabla `comprobante`
--
ALTER TABLE `comprobante`
  ADD PRIMARY KEY (`idcomprobante`);

--
-- Indices de la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  ADD PRIMARY KEY (`idcotizacion`),
  ADD KEY `fk_cotizacion_usuario1_idx` (`idusuario`),
  ADD KEY `fk_cotizacion_cliente1_idx` (`idcliente`);

--
-- Indices de la tabla `credito`
--
ALTER TABLE `credito`
  ADD PRIMARY KEY (`idcredito`),
  ADD KEY `fk_credito_venta1_idx` (`idventa`),
  ADD KEY `fk_credito_cliente1_idx` (`idcliente`);

--
-- Indices de la tabla `currency`
--
ALTER TABLE `currency`
  ADD PRIMARY KEY (`idcurrency`);

--
-- Indices de la tabla `detalleapartado`
--
ALTER TABLE `detalleapartado`
  ADD KEY `fk_detalleventa_producto1_idx` (`idproducto`),
  ADD KEY `fk_detalleapartado_apartado1_idx` (`idapartado`);

--
-- Indices de la tabla `detallecompra`
--
ALTER TABLE `detallecompra`
  ADD KEY `fk_detallecompra_producto1_idx` (`idproducto`),
  ADD KEY `fk_detallecompra_compra1_idx` (`idcompra`);

--
-- Indices de la tabla `detallecotizacion`
--
ALTER TABLE `detallecotizacion`
  ADD KEY `fk_detallecotizacion_producto1_idx` (`idproducto`),
  ADD KEY `fk_detallecotizacion_cotizacion1_idx` (`idcotizacion`);

--
-- Indices de la tabla `detalleventa`
--
ALTER TABLE `detalleventa`
  ADD KEY `fk_detalleventa_venta1_idx` (`idventa`),
  ADD KEY `fk_detalleventa_producto1_idx` (`idproducto`);

--
-- Indices de la tabla `empleado`
--
ALTER TABLE `empleado`
  ADD PRIMARY KEY (`idempleado`),
  ADD UNIQUE KEY `codigo_empleado_UNIQUE` (`codigo_empleado`);

--
-- Indices de la tabla `entrada`
--
ALTER TABLE `entrada`
  ADD PRIMARY KEY (`identrada`),
  ADD KEY `fk_entrada_producto1_idx` (`idproducto`),
  ADD KEY `fk_entrada_compra1_idx` (`idcompra`),
  ADD KEY `fk_entrada_apartado1_idx` (`idapartado`);

--
-- Indices de la tabla `eventoscalendar`
--
ALTER TABLE `eventoscalendar`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `historial_ediciones`
--
ALTER TABLE `historial_ediciones`
  ADD PRIMARY KEY (`idhistorial`),
  ADD KEY `fk_historial_venta` (`idventa`),
  ADD KEY `fk_historial_usuario` (`idusuario`);

--
-- Indices de la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD KEY `fk_inventario_producto1_idx` (`idproducto`);

--
-- Indices de la tabla `marca`
--
ALTER TABLE `marca`
  ADD PRIMARY KEY (`idmarca`);

--
-- Indices de la tabla `ordentaller`
--
ALTER TABLE `ordentaller`
  ADD PRIMARY KEY (`idorden`),
  ADD KEY `fk_ordentaller_cliente1_idx` (`idcliente`),
  ADD KEY `fk_ordentaller_marca1_idx` (`idmarca`),
  ADD KEY `fk_ordentaller_tecnico1_idx` (`idtecnico`);

--
-- Indices de la tabla `parametro`
--
ALTER TABLE `parametro`
  ADD PRIMARY KEY (`idparametro`),
  ADD KEY `fk_parametro_currency1_idx` (`idcurrency`);

--
-- Indices de la tabla `perecedero`
--
ALTER TABLE `perecedero`
  ADD KEY `fk_perecedero_producto1_idx` (`idproducto`);

--
-- Indices de la tabla `presentacion`
--
ALTER TABLE `presentacion`
  ADD PRIMARY KEY (`idpresentacion`);

--
-- Indices de la tabla `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`idproducto`),
  ADD UNIQUE KEY `codigo_interno_UNIQUE` (`codigo_interno`),
  ADD KEY `fk_producto_categoria_idx` (`idcategoria`),
  ADD KEY `fk_producto_presentacion1_idx` (`idpresentacion`),
  ADD KEY `fk_producto_marca1_idx` (`idmarca`);

--
-- Indices de la tabla `producto_proveedor`
--
ALTER TABLE `producto_proveedor`
  ADD KEY `fk_producto_proveedor_proveedor1_idx` (`idproveedor`),
  ADD KEY `fk_producto_proveedor_producto1_idx` (`idproducto`);

--
-- Indices de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  ADD PRIMARY KEY (`idproveedor`),
  ADD UNIQUE KEY `nombre_proveedor_UNIQUE` (`nombre_proveedor`),
  ADD UNIQUE KEY `codigo_proveedor_UNIQUE` (`codigo_proveedor`);

--
-- Indices de la tabla `proveedor_precio`
--
ALTER TABLE `proveedor_precio`
  ADD KEY `fk_proveedor_precio_proveedor1_idx` (`idproveedor`),
  ADD KEY `fk_proveedor_precio_producto1_idx` (`idproducto`);

--
-- Indices de la tabla `prueba`
--
ALTER TABLE `prueba`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `salida`
--
ALTER TABLE `salida`
  ADD PRIMARY KEY (`idsalida`),
  ADD KEY `fk_entrada_producto1_idx` (`idproducto`),
  ADD KEY `fk_salida_venta1_idx` (`idventa`),
  ADD KEY `fk_salida_apartado1_idx` (`idapartado`);

--
-- Indices de la tabla `tecnico`
--
ALTER TABLE `tecnico`
  ADD PRIMARY KEY (`idtecnico`);

--
-- Indices de la tabla `tiraje_comprobante`
--
ALTER TABLE `tiraje_comprobante`
  ADD PRIMARY KEY (`idtiraje`),
  ADD KEY `fk_tiraje_comprobante_comprobante1_idx` (`idcomprobante`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`idusuario`),
  ADD KEY `fk_usuario_empleado1_idx` (`idempleado`);

--
-- Indices de la tabla `venta`
--
ALTER TABLE `venta`
  ADD PRIMARY KEY (`idventa`),
  ADD UNIQUE KEY `numero_venta_UNIQUE` (`numero_venta`),
  ADD KEY `fk_venta_cliente1_idx` (`idcliente`),
  ADD KEY `fk_venta_usuario1_idx` (`idusuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `apartado`
--
ALTER TABLE `apartado`
  MODIFY `idapartado` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `caja`
--
ALTER TABLE `caja`
  MODIFY `idcaja` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categoria`
--
ALTER TABLE `categoria`
  MODIFY `idcategoria` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cliente`
--
ALTER TABLE `cliente`
  MODIFY `idcliente` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `compra`
--
ALTER TABLE `compra`
  MODIFY `idcompra` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comprobante`
--
ALTER TABLE `comprobante`
  MODIFY `idcomprobante` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  MODIFY `idcotizacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `credito`
--
ALTER TABLE `credito`
  MODIFY `idcredito` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `currency`
--
ALTER TABLE `currency`
  MODIFY `idcurrency` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `empleado`
--
ALTER TABLE `empleado`
  MODIFY `idempleado` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `entrada`
--
ALTER TABLE `entrada`
  MODIFY `identrada` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `eventoscalendar`
--
ALTER TABLE `eventoscalendar`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `historial_ediciones`
--
ALTER TABLE `historial_ediciones`
  MODIFY `idhistorial` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `marca`
--
ALTER TABLE `marca`
  MODIFY `idmarca` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ordentaller`
--
ALTER TABLE `ordentaller`
  MODIFY `idorden` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `parametro`
--
ALTER TABLE `parametro`
  MODIFY `idparametro` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `presentacion`
--
ALTER TABLE `presentacion`
  MODIFY `idpresentacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `idproducto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  MODIFY `idproveedor` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `prueba`
--
ALTER TABLE `prueba`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `salida`
--
ALTER TABLE `salida`
  MODIFY `idsalida` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tecnico`
--
ALTER TABLE `tecnico`
  MODIFY `idtecnico` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tiraje_comprobante`
--
ALTER TABLE `tiraje_comprobante`
  MODIFY `idtiraje` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `idusuario` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `venta`
--
ALTER TABLE `venta`
  MODIFY `idventa` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `apartado`
--
ALTER TABLE `apartado`
  ADD CONSTRAINT `fk_venta_cliente0` FOREIGN KEY (`idcliente`) REFERENCES `cliente` (`idcliente`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_usuario0` FOREIGN KEY (`idusuario`) REFERENCES `usuario` (`idusuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `caja_movimiento`
--
ALTER TABLE `caja_movimiento`
  ADD CONSTRAINT `fk_caja_movimiento_caja` FOREIGN KEY (`idcaja`) REFERENCES `caja` (`idcaja`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `compra`
--
ALTER TABLE `compra`
  ADD CONSTRAINT `fk_compra_proveedor` FOREIGN KEY (`idproveedor`) REFERENCES `proveedor` (`idproveedor`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  ADD CONSTRAINT `fk_cotizacion_cliente1` FOREIGN KEY (`idcliente`) REFERENCES `cliente` (`idcliente`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cotizacion_usuario1` FOREIGN KEY (`idusuario`) REFERENCES `usuario` (`idusuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `credito`
--
ALTER TABLE `credito`
  ADD CONSTRAINT `fk_credito_cliente1` FOREIGN KEY (`idcliente`) REFERENCES `cliente` (`idcliente`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_credito_venta1` FOREIGN KEY (`idventa`) REFERENCES `venta` (`idventa`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `detalleapartado`
--
ALTER TABLE `detalleapartado`
  ADD CONSTRAINT `fk_detalleapartado_apartado1` FOREIGN KEY (`idapartado`) REFERENCES `apartado` (`idapartado`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detalleventa_producto0` FOREIGN KEY (`idproducto`) REFERENCES `producto` (`idproducto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `detallecompra`
--
ALTER TABLE `detallecompra`
  ADD CONSTRAINT `fk_detallecompra_compra` FOREIGN KEY (`idcompra`) REFERENCES `compra` (`idcompra`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detallecompra_producto` FOREIGN KEY (`idproducto`) REFERENCES `producto` (`idproducto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `detallecotizacion`
--
ALTER TABLE `detallecotizacion`
  ADD CONSTRAINT `fk_detallecotizacion_cotizacion1` FOREIGN KEY (`idcotizacion`) REFERENCES `cotizacion` (`idcotizacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detallecotizacion_producto1` FOREIGN KEY (`idproducto`) REFERENCES `producto` (`idproducto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `detalleventa`
--
ALTER TABLE `detalleventa`
  ADD CONSTRAINT `fk_detalleventa_producto` FOREIGN KEY (`idproducto`) REFERENCES `producto` (`idproducto`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detalleventa_venta` FOREIGN KEY (`idventa`) REFERENCES `venta` (`idventa`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `entrada`
--
ALTER TABLE `entrada`
  ADD CONSTRAINT `fk_entrada_apartado` FOREIGN KEY (`idapartado`) REFERENCES `apartado` (`idapartado`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_entrada_compra` FOREIGN KEY (`idcompra`) REFERENCES `compra` (`idcompra`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_entrada_producto` FOREIGN KEY (`idproducto`) REFERENCES `producto` (`idproducto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD CONSTRAINT `fk_inventario_producto` FOREIGN KEY (`idproducto`) REFERENCES `producto` (`idproducto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ordentaller`
--
ALTER TABLE `ordentaller`
  ADD CONSTRAINT `fk_ordentaller_cliente` FOREIGN KEY (`idcliente`) REFERENCES `cliente` (`idcliente`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ordentaller_marca` FOREIGN KEY (`idmarca`) REFERENCES `marca` (`idmarca`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ordentaller_tecnico` FOREIGN KEY (`idtecnico`) REFERENCES `tecnico` (`idtecnico`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `parametro`
--
ALTER TABLE `parametro`
  ADD CONSTRAINT `fk_parametro_currency1` FOREIGN KEY (`idcurrency`) REFERENCES `currency` (`idcurrency`);

--
-- Filtros para la tabla `perecedero`
--
ALTER TABLE `perecedero`
  ADD CONSTRAINT `fk_perecedero_producto` FOREIGN KEY (`idproducto`) REFERENCES `producto` (`idproducto`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `producto`
--
ALTER TABLE `producto`
  ADD CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`idcategoria`) REFERENCES `categoria` (`idcategoria`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_producto_marca` FOREIGN KEY (`idmarca`) REFERENCES `marca` (`idmarca`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_producto_presentacion` FOREIGN KEY (`idpresentacion`) REFERENCES `presentacion` (`idpresentacion`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `producto_proveedor`
--
ALTER TABLE `producto_proveedor`
  ADD CONSTRAINT `fk_producto_proveedor_producto` FOREIGN KEY (`idproducto`) REFERENCES `producto` (`idproducto`),
  ADD CONSTRAINT `fk_producto_proveedor_proveedor` FOREIGN KEY (`idproveedor`) REFERENCES `proveedor` (`idproveedor`);

--
-- Filtros para la tabla `proveedor_precio`
--
ALTER TABLE `proveedor_precio`
  ADD CONSTRAINT `fk_proveedor_precio_producto` FOREIGN KEY (`idproducto`) REFERENCES `producto` (`idproducto`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_proveedor_precio_proveedor` FOREIGN KEY (`idproveedor`) REFERENCES `proveedor` (`idproveedor`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `salida`
--
ALTER TABLE `salida`
  ADD CONSTRAINT `fk_salida_apartado` FOREIGN KEY (`idapartado`) REFERENCES `apartado` (`idapartado`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_salida_producto` FOREIGN KEY (`idproducto`) REFERENCES `producto` (`idproducto`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_salida_venta` FOREIGN KEY (`idventa`) REFERENCES `venta` (`idventa`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `tiraje_comprobante`
--
ALTER TABLE `tiraje_comprobante`
  ADD CONSTRAINT `fk_tiraje_comprobante_comprobante` FOREIGN KEY (`idcomprobante`) REFERENCES `comprobante` (`idcomprobante`);

--
-- Filtros para la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `fk_usuario_empleado` FOREIGN KEY (`idempleado`) REFERENCES `empleado` (`idempleado`);

--
-- Filtros para la tabla `venta`
--
ALTER TABLE `venta`
  ADD CONSTRAINT `fk_venta_cliente` FOREIGN KEY (`idcliente`) REFERENCES `cliente` (`idcliente`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_usuario` FOREIGN KEY (`idusuario`) REFERENCES `usuario` (`idusuario`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
